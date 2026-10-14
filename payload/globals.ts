import type { Field, GlobalConfig } from 'payload';

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

/**
 * The UI dictionary (UiStrings): button labels, empty states, aria labels, form texts.
 * Fields are generated from this description: group → [label, { key: label }].
 */
type Spec = { [key: string]: string | [string, Spec] };

const UI: Spec = {
  common: [
    'Általános',
    {
      close: 'Bezárás',
      readMore: 'Tovább olvasom',
      more: 'Bővebben',
      signup: 'Jelentkezem gomb',
      mainNav: 'Főmenü (felolvasott név)',
      openMenu: 'Menü megnyitása (felolvasott)',
      closeMenu: 'Menü bezárása (felolvasott)',
      sliderPage: 'Csúszka oldala — {n} = szám',
      slideshow: 'Diavetítés (felolvasott)',
      playVideo: 'Videó lejátszása — {title} = cím',
      facebook: 'Facebook ikon (felolvasott)',
      instagram: 'Instagram ikon (felolvasott)',
      toc: 'Tartalom (felirat)',
      tocLabel: 'Tartalomjegyzék (felolvasott)',
      links: 'Linkek (felolvasott)',
    },
  ],
  shows: [
    'Előadások',
    {
      ticket: 'Jegyek gomb',
      registration: 'Regisztráció gomb',
      about: 'Az előadásról',
      info: 'Tudnivalók',
      nextShow: 'Következő előadás',
      onStage: 'Műsoron címke',
      upcomingCount: 'Előadások száma — {count} = szám',
      empty: 'Nincs közelgő előadás',
    },
  ],
  production: [
    'Előadás aloldal',
    {
      backLink: 'Vissza a repertoárhoz',
      upcomingLink: 'Közelgő előadások link',
      about: 'Az előadásról cím',
      highlights: 'Pontok címe',
      quotes: 'Nézői vélemények címe',
      video: 'Videó címe',
      gallery: 'Galéria címe',
      galleryLabel: 'Galéria (felolvasott) — {title} = cím',
      dates: 'Időpontok címe',
      noDates: 'Nincs időpont',
      ctaDates: 'Időpontok gomb',
      ctaBook: 'Foglalás gomb',
      ctaConvinced: 'Meggyőztetek gomb',
      invite: 'Meghívó videó címe',
    },
  ],
  repertoire: [
    'Repertoár szűrő',
    { filter: 'Szűrés (felolvasott)', all: 'Mind', company: 'Társulati', students: 'Hallgatói' },
  ],
  reviews: [
    'Vélemények',
    { previous: 'Előző (felolvasott)', next: 'Következő (felolvasott)', photoPlaceholder: 'Fotó helye — {name} = név' },
  ],
  gallery: [
    'Galéria',
    {
      previous: 'Előző képek',
      next: 'Következő képek',
      previousImage: 'Előző kép',
      nextImage: 'Következő kép',
      zoom: 'Nagyítás — {alt} = kép leírása',
    },
  ],
  course: [
    'Kurzusok',
    {
      rhythm: 'Ritmus',
      length: 'Hossz',
      admission: 'Felvétel',
      price: 'Díj',
      start: 'Indulás',
      startRolling: 'Folyamatos jelentkezés',
      startSoon: 'Hamarosan',
      details: 'Részletek',
      nextIntake: 'Következő indulás',
      startsEmpty: 'Nincs induló csoport',
      startsEmptyLink: ['Link üres állapotban', { label: 'Felirat', href: 'Cím (link)' }],
    },
  ],
  workshops: [
    'Workshopok',
    {
      date: 'Időpont',
      time: 'Napi időbeosztás',
      leader: 'Kurzusvezető',
      leaderHeading: 'A kurzusvezetőről',
      empty: 'Nincs workshop',
      followUs: 'Kövess minket',
    },
  ],
  sessions: [
    'Nyitott Műhely',
    {
      book: 'Jelentkezem gomb',
      closed: 'Lezárult',
      needed: 'Még kell jelentkező — {count} = szám',
      confirmed: 'Biztosan indul',
      full: 'Megtelt',
      left: 'Szabad helyek — {count} = szám',
      empty: 'Nincs időpont',
    },
  ],
  teamBuilding: ['Csapatépítő', { duration: 'Időkeret', venue: 'Helyszín' }],
  quoteForm: [
    'Árajánlat űrlap',
    {
      title: 'Cím',
      required: 'Kötelező mezők',
      fields: [
        'Mezők',
        {
          company: 'Cég',
          lastName: 'Vezetéknév',
          firstName: 'Keresztnév',
          email: 'E-mail',
          phone: 'Telefon',
          message: 'Üzenet',
        },
      ],
      messagePlaceholder: 'Üzenet mintaszöveg',
      error: 'Hibaüzenet',
      submit: 'Küldés gomb',
      note: 'Megjegyzés a gomb alatt',
      subject: 'E-mail tárgya — {company} = cég',
      mail: ['Az e-mail címkéi', { company: 'Cég', contact: 'Kapcsolattartó', email: 'E-mail', phone: 'Telefon' }],
    },
  ],
  contact: ['Kapcsolat', { person: 'Kapcsolattartó', directions: 'Útvonaltervezés' }],
  notFound: [
    '404 oldal',
    {
      title: 'Böngésző címsor',
      eyebrow: 'Felcím',
      heading: 'Cím — *csillagok közé* írt rész kiemelve',
      text: 'Szöveg',
      primary: ['Fő gomb', { label: 'Felirat', href: 'Cím (link)' }],
      secondary: ['Másodlagos gomb', { label: 'Felirat', href: 'Cím (link)' }],
    },
  ],
};

const uiFields = (spec: Spec): Field[] =>
  Object.entries(spec).map(
    ([name, value]): Field =>
      typeof value === 'string'
        ? { name, label: value, type: 'text', required: true }
        : { name, label: value[0], type: 'group', fields: uiFields(value[1]) },
  );

export const Ui: GlobalConfig = {
  slug: 'ui',
  label: 'Felületi szövegek',
  access,
  admin: {
    description:
      'Gombok, üres állapotok, űrlapok és felolvasott feliratok szövegei. A {kapcsos zárójeles} részeket a weboldal tölti ki — ezeket hagyd meg.',
  },
  hooks: globalRevalidation(),
  fields: uiFields(UI),
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

const emailText = (name: string, label: string, description: string): Field =>
  textarea(name, label, { description: `${description} Üresen az alapszöveg megy.` });

export const ApplicationSettings: GlobalConfig = {
  slug: 'applicationSettings',
  label: 'Jelentkezési beállítások',
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
    {
      name: 'texts',
      label: 'E-mailek bevezető bekezdése',
      type: 'group',
      fields: [
        emailText('signupReceived', 'Jelentkezés visszaigazolása', 'Nyitott Műhely és kezdő kurzus.'),
        emailText('applicationReceived', 'Szakmai jelentkezés visszaigazolása', ''),
        emailText('confirmed', 'Biztosan indul', 'A Nyitott Műhely résztvevőinek a határidőkor.'),
        emailText('cancelledMinimum', 'Elmarad (nincs elég jelentkező)', 'A következő időpontok listája automatikus.'),
        emailText('cancellation', 'Lemondás visszaigazolása', ''),
        emailText('accepted', 'Felvétel a kurzusba', 'A belépési link automatikus.'),
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
  ],
};
