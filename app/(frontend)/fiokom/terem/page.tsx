import AccountNav from '@/components/account/AccountNav';
import AccountShell, { Card } from '@/components/account/AccountShell';
import { accountMetadata } from '@/components/account/meta';
import StudentRoomBooking from '@/components/rooms/StudentRoomBooking';
import { payloadClient, requireUser } from '@/lib/auth';
import type { BookingSettings } from '@/lib/rooms/rules';
import { loadSettings, roomsById } from '@/lib/rooms/server';
import { studentOverview } from '@/lib/rooms/student';
import { userIsStaffOrAdmin } from '@/payload/access';

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Teremfoglalás');

const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

/** The rules in one sentence, from the settings. */
function rulesText(s: BookingSettings): string {
  const parts = [
    `legfeljebb ${num(s.maxHours)} órára`,
    `${s.horizonDays} nappal előre`,
    `${s.slotMinutes} perces egységekben`,
    s.hoursFrom && s.hoursTo ? `${s.hoursFrom} és ${s.hoursTo} között` : null,
    s.weeklyQuotaHours !== null ? `hetente összesen ${num(s.weeklyQuotaHours)} órát` : null,
  ].filter(Boolean);
  const cancel =
    s.cancelHoursBefore > 0 ? `legkésőbb ${num(s.cancelHoursBefore)} órával a kezdés előtt` : 'egészen a kezdésig';
  return `Gyakorláshoz ingyen foglalhatsz termet: ${parts.join(', ')}. A naptárban mindenki foglalását látod; húzz ki egy szabad időszakot a foglaláshoz. Lemondani ${cancel} lehet.`;
}

export default async function RoomBookingPage() {
  const user = await requireUser('/fiokom/terem');
  const payload = await payloadClient();
  const [o, rooms, settings] = await Promise.all([
    studentOverview(payload, user),
    roomsById(payload),
    loadSettings(payload),
  ]);

  return (
    <AccountShell eyebrow="Fiókom" heading="*Teremfoglalás*" wide>
      <AccountNav canBook={o.mayBook} isStaff={userIsStaffOrAdmin(user)} />
      {!o.mayBook ? (
        <Card>
          <p className="text-[16px] leading-relaxed text-ink2">
            Termet gyakorláshoz az foglalhat, akinek a munkatársaink engedélyt adtak. Ha szükséged van rá, szólj nekünk.
          </p>
        </Card>
      ) : (
        <StudentRoomBooking
          rooms={rooms.filter((r) => r.active)}
          groups={o.groups.map((g) => ({ id: g.id, title: g.title }))}
          productions={o.productions}
          bookings={o.ownPractice}
          slotMinutes={settings.slotMinutes}
          rules={rulesText(settings)}
        />
      )}
    </AccountShell>
  );
}
