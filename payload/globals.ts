import type { GlobalConfig } from 'payload';

import { WEEKDAYS } from '@/lib/rooms/labels';

import { anyone, isAdmin, isStaffOrAdmin } from './access';
import { date, link, links, relationship, text, textarea, time } from './fields';
import { globalRevalidation } from './revalidate';

const access = { read: anyone, update: isStaffOrAdmin };

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Weboldal beállításai',
  access,
  admin: {
    description: 'A weboldal egészére érvényes adatok: menü, lábléc, elérhetőségek, közösségi média.',
  },
  hooks: globalRevalidation(),
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Általános',
          fields: [
            text('name', 'A színműhely neve', { required: true }),
            text('tagline', 'Jelmondat', { required: true }),
            text('copyright', 'Copyright sor', { required: true }),
          ],
        },
        {
          label: 'Menü',
          fields: [
            {
              name: 'nav',
              label: 'Főmenü',
              labels: { singular: 'Menüpont', plural: 'Menüpontok' },
              type: 'array',
              required: true,
              fields: [
                ...link('_', '', { required: true }).fields,
                {
                  name: 'match',
                  label: 'Ezeken az oldalakon is aktív',
                  type: 'text',
                  hasMany: true,
                  admin: { description: 'Pl. a „Képzések” a /kezdo-kurzus oldalon is kiemelt.' },
                },
              ],
            },
            link('headerCta', 'Gomb a fejlécben', { required: true }),
          ],
        },
        {
          label: 'Lábléc',
          fields: [
            {
              name: 'footerColumns',
              label: 'Lábléc oszlopai',
              labels: { singular: 'Oszlop', plural: 'Oszlopok' },
              type: 'array',
              required: true,
              fields: [
                text('title', 'Cím', { required: true }),
                links('links', 'Linkek', { required: true }),
                { name: 'social', label: 'Közösségi média ikonok', type: 'checkbox' },
              ],
            },
            link('privacy', 'Adatvédelmi link', { required: true }),
          ],
        },
        {
          label: 'Elérhetőség',
          fields: [
            {
              name: 'contact',
              label: 'Elérhetőség',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [text('email', 'E-mail', { required: true }), text('address', 'Cím', { required: true })],
                },
                relationship('primaryPerson', 'Elsődleges kapcsolattartó', 'contactPeople', { required: true }),
              ],
            },
            {
              name: 'social',
              label: 'Közösségi média',
              type: 'group',
              fields: [
                text('facebook', 'Facebook oldal', { required: true }),
                text('instagram', 'Instagram oldal', { required: true }),
                text('tixa', 'Tixa szervezői oldal', {
                  description: 'A jegyértékesítő oldal, ahol az összes előadásunk látszik.',
                }),
              ],
            },
            {
              name: 'map',
              label: 'Térkép',
              type: 'group',
              fields: [
                textarea('embedUrl', 'Beágyazási cím', {
                  required: true,
                  description: 'Google Térkép → Megosztás → Térkép beágyazása → az src="…" cím.',
                }),
                text('directionsUrl', 'Útvonaltervezés link', { required: true }),
                text('title', 'A térkép leírása', { required: true }),
              ],
            },
          ],
        },
        {
          label: 'Hivatkozások',
          fields: [
            {
              name: 'urls',
              label: 'Oldalak címei',
              type: 'group',
              admin: { description: 'Ide mutatnak a „Közelgő előadások” és a „Repertoár” linkek.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    text('upcomingShows', 'Közelgő előadások', { required: true }),
                    text('repertoire', 'Repertoár', { required: true }),
                  ],
                },
              ],
            },
            {
              name: 'productionPage',
              label: 'Előadás aloldalak',
              type: 'group',
              fields: [relationship('ctaBand', 'Felhívás sáv az aloldal alján', 'ctaBands', { required: true })],
            },
          ],
        },
      ],
    },
  ],
};

/** Rules of student room booking (lib/rooms/rules.ts). Staff and admins are not bound by them. */
export const RoomBookingSettings: GlobalConfig = {
  slug: 'roomBookingSettings',
  label: 'Teremfoglalási szabályok',
  access: { read: isStaffOrAdmin, update: isStaffOrAdmin },
  admin: {
    description:
      'A diákok teremfoglalásának szabályai. A munkatársakra nem vonatkoznak (az ütközés tilalma mindenkire igen).',
  },
  fields: [
    relationship('homeVenue', 'A termek helyszíne', 'venues', {
      description:
        'A Nyitott Műhely, a képzések és a diákfoglalások helye. Az ide kiírt előadás (kézzel vagy a Facebookról) minden termet lefoglal, és lemond mindent, ami az útjában van.',
    }),
    {
      type: 'row',
      fields: [
        {
          name: 'showRoomsBefore',
          label: 'Előadás: termek a kezdés előtt (perc)',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 90,
          admin: { description: 'Beállás, bemelegítés.' },
        },
        {
          name: 'showRoomsAfter',
          label: 'Előadás: termek a kezdés után (perc)',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 150,
          admin: { description: 'Az előadás és a bontás. Egy-egy előadásnál az alkalmát módosítva változtatható.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        time('studentHoursFrom', 'Foglalható ettől', { description: 'Üresen: éjjel-nappal.' }),
        time('studentHoursTo', 'Foglalható eddig', { description: 'Üresen: éjjel-nappal.' }),
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'slotMinutes',
          label: 'Időegység (perc)',
          type: 'select',
          required: true,
          defaultValue: '30',
          options: ['15', '30', '60'],
          admin: { description: 'A foglalás eleje és vége erre kerekedik.' },
        },
        {
          name: 'maxHours',
          label: 'Leghosszabb foglalás (óra)',
          type: 'number',
          required: true,
          min: 0.5,
          defaultValue: 8,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'horizonDays',
          label: 'Előre foglalható (nap)',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 30,
        },
        {
          name: 'minNoticeHours',
          label: 'Legalább ennyivel előre (óra)',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 0,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'weeklyQuotaHours',
          label: 'Heti keret diákonként (óra)',
          type: 'number',
          min: 0,
          admin: { description: 'Üresen: korlátlan.' },
        },
        {
          name: 'cancelHoursBefore',
          label: 'Lemondható a kezdés előtt (óra)',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 0,
          admin: { description: '0: egészen a kezdésig.' },
        },
      ],
    },
    {
      name: 'closedDates',
      label: 'Zárva tartó napok',
      labels: { singular: 'Nap', plural: 'Napok' },
      type: 'array',
      admin: { description: 'Ezekre a napokra a „Hónap feltöltése” nem hoz létre alkalmat (ünnepek, szünetek).' },
      fields: [
        {
          type: 'row',
          fields: [
            { ...date('date', 'Nap', { required: true }), index: false },
            text('note', 'Megjegyzés', { description: 'Pl. „Mindenszentek”' }),
          ],
        },
      ],
    },
  ],
};

export const ApplicationSettings: GlobalConfig = {
  slug: 'applicationSettings',
  label: 'Nyitott Műhely jelentkezési beállítások',
  access: { read: isStaffOrAdmin, update: isStaffOrAdmin },
  admin: {
    description: 'Kik kapnak értesítést az új jelentkezésekről, a Nyitott Műhely határidői és az e-mailek bevezetői.',
  },
  fields: [
    {
      name: 'notifyEmails',
      label: 'Értesítendő címek',
      labels: { singular: 'Cím', plural: 'Címek' },
      type: 'array',
      defaultValue: [{ email: 'info@morpheus-szinmuhely.hu' }],
      admin: { description: 'Ide megy minden új jelentkezés és lemondás.' },
      fields: [{ name: 'email', label: 'E-mail-cím', type: 'email', required: true }],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'workshopCutoffHours',
          label: 'Döntés az indulásról (óra)',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 48,
          admin: {
            description:
              'A Nyitott Műhely ennyi órával a kezdés előtt dől el: elég jelentkező esetén indul, különben elmarad.',
          },
        },
        {
          name: 'userCancelHours',
          label: 'Lemondási határidő (óra)',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 24,
          admin: { description: 'A résztvevő eddig mondhatja le a jelentkezését a fiókjában.' },
        },
      ],
    },
    {
      name: 'workshopDefaults',
      label: 'Nyitott Műhely alapértékek',
      type: 'group',
      admin: {
        description:
          'A Teremnaptár „Hónap feltöltése” ezekkel hozza létre a Nyitott Műhely időpontjait (a nap, az idő és a terem ott még átírható).',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'weekday',
              label: 'Nap',
              type: 'select',
              defaultValue: '6',
              options: WEEKDAYS.map((label, i) => ({ label, value: String(i + 1) })),
              admin: { width: '34%' },
            },
            { ...time('startTime', 'Kezdés'), defaultValue: '14:00', admin: { width: '33%' } },
            { ...time('endTime', 'Vége'), defaultValue: '16:00', admin: { width: '33%' } },
          ],
        },
        relationship('rooms', 'Termek', 'rooms', {
          hasMany: true,
          description: 'Üresen helyszín nélkül jön létre; a Teremnaptárban később elhelyezheted.',
        }),
        {
          type: 'row',
          fields: [
            { name: 'price', label: 'Ár (Ft)', type: 'number', min: 0, defaultValue: 5000 },
            { name: 'minParticipants', label: 'Minimum létszám', type: 'number', min: 1, defaultValue: 5 },
            { name: 'maxParticipants', label: 'Maximum létszám', type: 'number', min: 1, defaultValue: 16 },
          ],
        },
      ],
    },
  ],
};

/** Online payment and invoicing (lib/payments, lib/invoicing). Secrets (API keys) are env only. */
export const BillingSettings: GlobalConfig = {
  slug: 'billingSettings',
  label: 'Fizetési beállítások',
  access: { read: isStaffOrAdmin, update: isAdmin },
  admin: {
    description:
      'Online fizetés és számlázás. A kulcsok (fizetési szolgáltató, Számlázz.hu) nem itt, hanem a szerver beállításaiban vannak.',
  },
  hooks: globalRevalidation(),
  fields: [
    {
      name: 'onlinePayments',
      label: 'Online fizetés',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Kikapcsolva a Nyitott Műhely-jelentkezés újra fizetés nélküli (a helyszínen fizetnek); a már elkezdett fizetések rendben lezárulnak.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'vatMode',
          label: 'ÁFA',
          type: 'select',
          required: true,
          defaultValue: 'AAM',
          options: [
            { label: 'Alanyi adómentes (AAM)', value: 'AAM' },
            { label: '27%', value: '27' },
            { label: '18%', value: '18' },
            { label: '5%', value: '5' },
          ],
        },
        {
          name: 'transferDueDays',
          label: 'Átutalási határidő (nap)',
          type: 'number',
          min: 1,
          defaultValue: 8,
          admin: { description: 'A havidíj- és részletszámlák fizetési határideje a kiállítástól.' },
        },
        {
          name: 'invoicePrefix',
          label: 'Számlaszám előtag',
          type: 'text',
          admin: {
            description: 'A Számlázz.hu-ban beállított számlatömb előtagja (pl. MSZ). Üresen: a fiók alapértelmezése.',
          },
        },
        {
          name: 'ordersHoldMinutes',
          label: 'Helyfoglalás fizetésig (perc)',
          type: 'number',
          required: true,
          min: 5,
          defaultValue: 30,
          admin: { description: 'Ennyi ideig tartjuk a helyet, amíg a jelentkező fizet; utána felszabadul.' },
        },
      ],
    },
    {
      name: 'showDefaults',
      label: 'Előadások saját jegyfoglalással',
      type: 'group',
      admin: { description: 'Ha egy előadás-időpontnál nincs külön megadva.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'price', label: 'Jegyár (Ft)', type: 'number', required: true, min: 0, defaultValue: 3500 },
            { name: 'seats', label: 'Férőhely', type: 'number', required: true, min: 1, defaultValue: 30 },
            {
              name: 'maxPerBooking',
              label: 'Jegy foglalásonként legfeljebb',
              type: 'number',
              required: true,
              min: 1,
              defaultValue: 10,
            },
          ],
        },
      ],
    },
  ],
};
