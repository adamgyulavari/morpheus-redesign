/**
 * The `orderPaid` job (payload.config.ts), after a payment: a workshop gets its confirmation (with
 * .ics); a kezdő group admits the person (the welcome e-mail); without a group it waits for staff
 * to place it. Staff get a notice; then the invoice. Safe to run again (a job retry).
 */
import type { Payload } from 'payload';

import { sendAccepted } from '@/lib/applications/notify';
import {
  applicantOf,
  countText,
  courseInfo,
  inTransaction,
  joinGroup,
  NOBODY,
  takenBy,
  workshopInfo,
} from '@/lib/applications/server';
import { applicationSettings } from '@/lib/applications/settings';
import { formatHuf } from '@/lib/format';
import { issueInvoice } from '@/lib/invoicing/service';
import { icsFile } from '@/lib/rooms/ics';
import { emailTexts } from '@/payload/email-texts';
import { relId } from '@/payload/rel';
import type { Order, Session } from '@/payload-types';

import { sendOrderPaid, sendStaffPaid } from './notify';
import { targetOf } from './target';

export async function afterPaid(payload: Payload, orderId: number) {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 1, disableErrors: true });
  // gone (deleted by staff): nothing to confirm
  const application = order && typeof order.application === 'object' ? order.application : null;
  if (!order || !application) return;
  const settings = await applicationSettings(payload);
  const user = typeof order.user === 'object' ? order.user : null;
  const applicant = applicantOf(application, user?.firstName);
  const money = { price: order.price, amountDue: order.amountDue };
  if (order.kind === 'workshop') {
    const s = await payload.findByID({ collection: 'sessions', id: relId(application.session) ?? 0, depth: 0 });
    const info = await workshopInfo(payload, s, settings);
    await sendOrderPaid(payload, applicant, info, money, {
      loggedIn: false,
      ics: workshopIcs(application.id, s, info),
    });
    const taken = (await takenBy(payload, 'session_id', [s.id])).get(s.id) ?? NOBODY;
    await sendStaffPaid(payload, settings, applicant, info, money, countText(taken, s));
  } else if (order.kind === 'beginner') {
    const { info } = await targetOf(payload, application, new Date());
    const groupId = relId(application.courseGroup);
    const userId = relId(application.user);
    if (groupId && userId) {
      const g = await inTransaction(payload, async (req) => {
        const group = await payload.findByID({ collection: 'courseGroups', id: groupId, depth: 0, req });
        await joinGroup(req, userId, group);
        return group;
      });
      const { common } = await emailTexts(payload);
      await sendAccepted(payload, settings, applicant, courseInfo(g), [
        { label: common.labelPaid, value: paidText(order) },
      ]);
    } else {
      await sendOrderPaid(payload, applicant, info, money, { loggedIn: false, waitingForGroup: true });
    }
    await sendStaffPaid(payload, settings, applicant, info, money);
  }
  // the invoice (Számlázz.hu e-mails it); never throws — failures are stored and reported
  await issueInvoice(payload, orderId);
}

/** "80 000 Ft — Két részletben (1/2)" */
const paidText = (order: Order) => {
  const parts = order.plan?.parts ?? 1;
  return (
    [formatHuf(order.amountDue), order.plan?.label].filter(Boolean).join(' — ') + (parts > 1 ? ` (1/${parts})` : '')
  );
};

const workshopIcs = (applicationId: number, s: Session, info: { title: string; place?: string }) =>
  icsFile({
    uid: `application-${applicationId}@morpheus-szinmuhely.hu`,
    start: new Date(s.start),
    end: new Date(s.end),
    summary: `${info.title} — Morpheus Színműhely`,
    location: info.place,
  });
