import AccountNav from '@/components/account/AccountNav';
import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { accountMetadata } from '@/components/account/meta';
import StudentRoomBooking from '@/components/rooms/StudentRoomBooking';
import { payloadClient, requireUser } from '@/lib/auth';
import { getUi } from '@/lib/data';
import { fill } from '@/lib/format';
import type { BookingSettings } from '@/lib/rooms/rules';
import { loadSettings, roomsById } from '@/lib/rooms/server';
import { studentOverview } from '@/lib/rooms/student';
import type { UiStrings } from '@/lib/types';
import { userIsStaffOrAdmin } from '@/payload/access';

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = async () => accountMetadata((await getUi()).rooms.title);

const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

/** The rules in one sentence, from the settings. */
function rulesText(s: BookingSettings, t: UiStrings['rooms']): string {
  const parts = [
    fill(t.ruleMax, { hours: num(s.maxHours) }),
    fill(t.ruleHorizon, { days: s.horizonDays }),
    fill(t.ruleSlot, { minutes: s.slotMinutes }),
    s.hoursFrom && s.hoursTo ? fill(t.ruleHours, { from: s.hoursFrom, to: s.hoursTo }) : null,
    s.weeklyQuotaHours !== null ? fill(t.ruleQuota, { hours: num(s.weeklyQuotaHours) }) : null,
  ].filter(Boolean);
  const cancel =
    s.cancelHoursBefore > 0 ? fill(t.cancelBefore, { hours: num(s.cancelHoursBefore) }) : t.cancelUntilStart;
  return fill(t.rules, { rules: parts.join(', '), cancel });
}

export default async function RoomBookingPage() {
  const user = await requireUser('/fiokom/terem');
  const payload = await payloadClient();
  const [o, rooms, settings, ui] = await Promise.all([
    studentOverview(payload, user),
    roomsById(payload),
    loadSettings(payload),
    getUi(),
  ]);

  return (
    <AccountShell eyebrow={ui.nav.myAccount} heading={`*${ui.rooms.title}*`} wide>
      <AccountNav canBook={o.mayBook} isStaff={userIsStaffOrAdmin(user)} />
      {!o.mayBook ? (
        <Card>
          <p className="text-[16px] leading-relaxed text-ink2">{ui.rooms.notAllowed}</p>
        </Card>
      ) : (
        <StudentRoomBooking
          rooms={rooms.filter((r) => r.active)}
          groups={o.groups.map((g) => ({ id: g.id, title: g.title }))}
          productions={o.productions}
          bookings={o.ownPractice}
          slotMinutes={settings.slotMinutes}
          rules={rulesText(settings, ui.rooms)}
        />
      )}
    </AccountShell>
  );
}
