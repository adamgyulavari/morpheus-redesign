/**
 * The e-mails' texts are content, edited in the admin (Beállítások → E-mailek; the `emailTexts`
 * global). This is only their catalogue: which e-mails there are, their fields and the
 * placeholders each may use — the wording itself is in the database (its first version came with
 * the migration 20261019_*_email_texts). `{keresztnev}` etc. are filled in when sending.
 * The technical staff alerts (lib/payments/notify sendStaffAlert) are not here: they stay in code.
 */
import type { Field, GlobalConfig, Payload } from 'payload';

import { isStaffOrAdmin } from './access';

type Extra = { name: string; label: string; description?: string; long?: boolean };
type Template = {
  label: string;
  /** Placeholders this e-mail fills, e.g. ['keresztnev', 'cim']. */
  vars: string[];
  button?: boolean;
  footnote?: boolean;
  extra?: Extra[];
};

export const EMAIL_VARS: Record<string, string> = {
  keresztnev: 'a címzett keresztneve',
  nev: 'a jelentkező teljes neve',
  email: 'a jelentkező e-mail-címe',
  cim: 'mire szól (alkalom, csoport neve)',
  mikor: 'mikor (időpont vagy a kurzus dátumai)',
  hol: 'helyszín',
  regi: 'a régi időpont',
  osszeg: 'összeg (pl. 5000 Ft)',
  hatarido: 'meddig tartjuk a helyet / fizetési határidő',
  minimum: 'a minimális létszám',
  dontes: 'mikor dől el, hogy indul-e',
  lemondas: 'hány órával előtte lehet lemondani',
  fajta: 'a jelentkezés fajtája',
  ok: 'az ok (ha megadták)',
  valtozas: 'mi változott (ideje / helyszíne / ideje és helyszíne)',
  kod: 'a belépési kód',
  jegyek: 'a foglalt jegyek száma',
};

/** Every e-mail, by tab. The fields: subject, preheader, heading, text (+ button, footnote, extras). */
export const EMAILS: Record<string, { label: string; templates: Record<string, Template> }> = {
  signup: {
    label: 'Jelentkezés',
    templates: {
      signupWorkshop: {
        label: 'Nyitott Műhely: jelentkezés (online fizetés nélkül)',
        vars: ['keresztnev', 'cim', 'mikor', 'hol', 'minimum', 'dontes', 'lemondas'],
        button: true,
      },
      signupBeginner: {
        label: 'Kezdő: jelentkezés egy csoportba (fizetés nélkül)',
        vars: ['keresztnev', 'cim', 'mikor'],
        button: true,
      },
      signupBeginnerNoGroup: { label: 'Kezdő: jelentkezés csoport nélkül', vars: ['keresztnev', 'cim'], button: true },
      applicationReceived: { label: 'Szakmai: jelentkezés', vars: ['keresztnev', 'cim'], button: true },
      moved: { label: 'Áthelyezés másik időpontra', vars: ['keresztnev', 'cim', 'mikor', 'regi', 'hol'], button: true },
      cancelledBySelf: {
        label: 'Lemondás (a résztvevő mondta le)',
        vars: ['keresztnev', 'cim', 'mikor'],
        button: true,
      },
      cancelledByStaff: { label: 'Lemondás (mi mondtuk le)', vars: ['keresztnev', 'cim', 'mikor'], button: true },
      workshopConfirmed: {
        label: 'Nyitott Műhely: biztosan indul',
        vars: ['keresztnev', 'cim', 'mikor', 'hol'],
        button: true,
      },
      workshopCancelled: {
        label: 'Nyitott Műhely: elmarad (nincs elég jelentkező)',
        vars: ['keresztnev', 'cim', 'mikor'],
        button: true,
        extra: [
          { name: 'nextDates', label: 'Ha van másik időpont', description: 'Utána jön az időpontok listája.' },
          { name: 'noNextDates', label: 'Ha nincs másik időpont' },
          { name: 'cancelledLabel', label: 'Sor: az elmaradó időpont', description: 'Pl. „Elmarad”' },
          { name: 'nextLabel', label: 'Sor: egy új időpont', description: 'Pl. „Új időpont”' },
        ],
      },
      accepted: { label: 'Felvétel a kurzusba', vars: ['keresztnev', 'cim', 'mikor'], button: true },
      staffNew: {
        label: 'Munkatársaknak: új jelentkezés',
        vars: ['nev', 'email', 'cim', 'mikor', 'fajta'],
        button: true,
      },
      staffCancelled: { label: 'Munkatársaknak: lemondás', vars: ['nev', 'email', 'cim', 'mikor'] },
      staffMoved: { label: 'Munkatársaknak: áthelyezés', vars: ['nev', 'email', 'cim', 'mikor', 'regi'] },
    },
  },
  payment: {
    label: 'Fizetés',
    templates: {
      paymentLink: {
        label: 'Fizetési link (a jelentkezéskor)',
        vars: ['keresztnev', 'cim', 'mikor', 'osszeg', 'hatarido'],
        button: true,
      },
      orderPaid: {
        label: 'Sikeres fizetés',
        vars: ['keresztnev', 'cim', 'mikor', 'hol', 'osszeg'],
        button: true,
        extra: [
          { name: 'calendarNote', label: 'Ha van naptárfájl', description: 'Nyitott Műhelynél csatoljuk.' },
          { name: 'waitingForGroup', label: 'Kezdő, csoport nélkül', description: 'Amikor még nincs csoportja.' },
        ],
      },
      lateRefund: {
        label: 'Késve érkezett fizetés visszautalása',
        vars: ['keresztnev', 'cim', 'mikor', 'osszeg'],
        button: true,
      },
      staffPaid: {
        label: 'Munkatársaknak: új fizetett jelentkezés',
        vars: ['nev', 'email', 'cim', 'mikor', 'osszeg'],
        button: true,
      },
    },
  },
  rooms: {
    label: 'Teremfoglalás',
    templates: {
      bookingConfirmed: {
        label: 'Teremfoglalás visszaigazolása',
        vars: ['keresztnev', 'mikor', 'hol'],
        button: true,
        footnote: true,
      },
      bookingCancelledBySelf: {
        label: 'Teremfoglalás lemondva (a hallgató)',
        vars: ['keresztnev', 'mikor', 'hol'],
        button: true,
      },
      bookingCancelledByStaff: {
        label: 'Teremfoglalás lemondva (munkatárs)',
        vars: ['keresztnev', 'mikor', 'hol', 'ok'],
        button: true,
      },
      bookingMoved: { label: 'Teremfoglalás módosítva', vars: ['keresztnev', 'mikor', 'hol'], button: true },
      sessionCancelled: { label: 'Óra / próba elmarad', vars: ['keresztnev', 'cim', 'mikor', 'hol'], button: true },
      sessionReinstated: { label: 'Óra / próba mégis lesz', vars: ['keresztnev', 'cim', 'mikor', 'hol'], button: true },
      sessionChanged: {
        label: 'Óra / próba változott',
        vars: ['keresztnev', 'cim', 'mikor', 'hol', 'valtozas'],
        button: true,
        extra: [
          { name: 'changedTime', label: '{valtozas}, ha az idő változott', description: 'Pl. „ideje”' },
          { name: 'changedPlace', label: '{valtozas}, ha a helyszín változott', description: 'Pl. „helyszíne”' },
          { name: 'changedBoth', label: '{valtozas}, ha mindkettő', description: 'Pl. „ideje és helyszíne”' },
        ],
      },
    },
  },
  tickets: {
    label: 'Jegyfoglalás',
    templates: {
      ticketBooked: {
        label: 'Ingyenes előadás: jegyfoglalás',
        vars: ['keresztnev', 'cim', 'mikor', 'hol', 'jegyek'],
        button: true,
        extra: [
          { name: 'accountCreated', label: 'Új fiók készült', description: 'A levél végén.' },
          { name: 'accountExisting', label: 'Meglévő fiók', description: 'A levél végén.' },
        ],
      },
      ticketPaymentLink: {
        label: 'Jegyvásárlás: fizetési link',
        vars: ['keresztnev', 'cim', 'mikor', 'hol', 'jegyek', 'osszeg', 'hatarido'],
        button: true,
      },
      ticketPaid: {
        label: 'Jegyvásárlás: sikeres fizetés',
        vars: ['keresztnev', 'cim', 'mikor', 'hol', 'jegyek', 'osszeg'],
        button: true,
        extra: [{ name: 'calendarNote', label: 'A naptárfájlról' }],
      },
      ticketCancelledBySelf: {
        label: 'Lemondott jegyfoglalás (a néző mondta le)',
        vars: ['keresztnev', 'cim', 'mikor', 'jegyek'],
        button: true,
      },
      ticketCancelledByStaff: {
        label: 'Lemondott jegyfoglalás (mi mondtuk le)',
        vars: ['keresztnev', 'cim', 'mikor', 'jegyek'],
        button: true,
      },
      staffTicketBooked: {
        label: 'Munkatársaknak: új jegyfoglalás',
        vars: ['nev', 'email', 'cim', 'mikor', 'jegyek'],
        button: true,
      },
      staffTicketPaid: {
        label: 'Munkatársaknak: új jegyvásárlás',
        vars: ['nev', 'email', 'cim', 'mikor', 'jegyek', 'osszeg'],
        button: true,
      },
      staffTicketCancelled: {
        label: 'Munkatársaknak: lemondott jegyfoglalás',
        vars: ['nev', 'email', 'cim', 'mikor', 'jegyek'],
      },
    },
  },
  account: {
    label: 'Fiók',
    templates: {
      verifyEmail: { label: 'E-mail-cím megerősítése', vars: ['keresztnev'], button: true, footnote: true },
      resetPassword: { label: 'Új jelszó beállítása', vars: ['keresztnev'], button: true, footnote: true },
      magicLink: {
        label: 'Belépési link és kód',
        vars: ['keresztnev', 'kod'],
        button: true,
        footnote: true,
        extra: [{ name: 'codeIntro', label: 'A kód előtti mondat' }],
      },
    },
  },
};

/** Shared: the greeting, the rows' labels, the notes under the button, the footer. */
export const COMMON = [
  { name: 'greeting', label: 'Megszólítás', description: 'Pl. „Kedves {keresztnev}!”' },
  { name: 'greetingNoName', label: 'Megszólítás név nélkül', description: 'Pl. „Kedves Jelentkezőnk!”' },
  { name: 'accountCreated', label: 'Új fiók készült', description: 'A jelentkezési levelek végén.' },
  { name: 'accountExisting', label: 'Meglévő fiók', description: 'A jelentkezési levelek végén.' },
  { name: 'myAccountButton', label: 'Gomb: a fiók', description: 'Pl. „Fiókom”' },
  {
    name: 'loginLinkNote',
    label: 'Belépési link megjegyzés',
    description: 'A belépési linkes gomb alatt.',
    long: true,
  },
  { name: 'buttonHelp', label: 'Ha a gomb nem működik', long: true },
  { name: 'footer', label: 'Lábléc', long: true },
  { name: 'labelWhat', label: 'Sor: mire' },
  { name: 'labelWhen', label: 'Sor: mikor' },
  { name: 'labelWhere', label: 'Sor: hol' },
  { name: 'labelPrice', label: 'Sor: ár' },
  { name: 'labelSeats', label: 'Sor: jegyek' },
  { name: 'labelTicket', label: 'Jegy a QR-kód alatt', description: 'Pl. „{n}. jegy” — {n}: hányadik.' },
  { name: 'labelPaid', label: 'Sor: fizetve' },
  { name: 'labelDue', label: 'Sor: fizetendő' },
  { name: 'labelRefunded', label: 'Sor: visszautalva' },
  { name: 'labelPayment', label: 'Sor: fizetés módja' },
  { name: 'labelName', label: 'Sor: név' },
  { name: 'labelEmail', label: 'Sor: e-mail' },
  { name: 'labelPhone', label: 'Sor: telefon' },
  { name: 'labelMessage', label: 'Sor: üzenet' },
  { name: 'labelCount', label: 'Sor: létszám' },
  { name: 'labelFor', label: 'Sor: mihez (teremfoglalás)' },
  { name: 'labelNote', label: 'Sor: megjegyzés' },
  { name: 'labelReason', label: 'Sor: ok' },
  { name: 'placePending', label: 'Ha még nincs helyszín', description: 'Pl. „Helyszín egyeztetés alatt”' },
] as const satisfies readonly Extra[];

const varsText = (vars: string[]) =>
  vars.length ? `Beírható: ${vars.map((v) => `{${v}} — ${EMAIL_VARS[v] ?? v}`).join('; ')}.` : undefined;

const templateFields = (key: string, t: Template): Field => ({
  name: key,
  label: t.label,
  type: 'group',
  admin: { description: varsText(t.vars) },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'subject', label: 'Tárgy', type: 'text', required: true },
        { name: 'preheader', label: 'Előnézet', type: 'text', admin: { description: 'A levelezőben a tárgy után.' } },
      ],
    },
    { name: 'heading', label: 'Cím', type: 'text', required: true },
    {
      name: 'text',
      label: 'Szöveg',
      type: 'textarea',
      required: true,
      admin: { description: 'A bekezdéseket üres sor választja el. A megszólítás automatikus.' },
    },
    ...(t.button || t.footnote
      ? [
          {
            type: 'row' as const,
            fields: [
              ...(t.button ? [{ name: 'button', label: 'Gomb felirata', type: 'text' as const, required: true }] : []),
              ...(t.footnote ? [{ name: 'footnote', label: 'Apró betű a gomb alatt', type: 'textarea' as const }] : []),
            ],
          },
        ]
      : []),
    ...(t.extra ?? []).map(
      (e): Field => ({ name: e.name, label: e.label, type: 'textarea', admin: { description: e.description } }),
    ),
  ],
});

export const EmailTexts: GlobalConfig = {
  slug: 'emailTexts',
  label: 'E-mailek',
  access: { read: isStaffOrAdmin, update: isStaffOrAdmin },
  admin: {
    description:
      'Az automatikus levelek szövegei. A {kapcsos} szavak helyére küldéskor kerül az adat (mindegyiknél ott a lista). A levél felépítése (logó, sorok, gomb) automatikus.',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        ...Object.entries(EMAILS).map(([name, tab]) => ({
          name,
          label: tab.label,
          fields: Object.entries(tab.templates).map(([key, t]) => templateFields(key, t)),
        })),
        {
          name: 'common',
          label: 'Közös',
          fields: (COMMON as readonly Extra[]).map(
            (c): Field =>
              c.long
                ? {
                    name: c.name,
                    label: c.label,
                    type: 'textarea',
                    required: true,
                    admin: { description: c.description },
                  }
                : { name: c.name, label: c.label, type: 'text', required: true, admin: { description: c.description } },
          ),
        },
      ],
    },
  ],
};
// ── reading them ────────────────────────────────────────────────────────────

type Vars = Record<string, string | number | null | undefined>;
export type Common = { [K in (typeof COMMON)[number]['name']]: string };
export type EmailTemplate = {
  subject: string;
  preheader?: string | null;
  heading: string;
  text: string;
  button?: string | null;
  footnote?: string | null;
  [extra: string]: string | null | undefined;
};

/**
 * `{name}` → its value: a known placeholder without a value is left empty; an unknown one stays
 * visible (so a typo shows in the e-mail).
 */
export const fill = (s: string | null | undefined, vars: Vars) =>
  (s ?? '').replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] != null ? String(vars[k]) : k in EMAIL_VARS ? '' : m));

/** Paragraphs: separated by an empty line. */
export const paragraphs = (s: string | null | undefined, vars: Vars) =>
  fill(s, vars)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/** The texts (one read per e-mail; small). */
export async function emailTexts(payload: Payload) {
  const doc = (await payload.findGlobal({ slug: 'emailTexts', depth: 0 })) as unknown as Record<
    string,
    Record<string, EmailTemplate>
  > & { common: Common };
  const template = (key: string): EmailTemplate => {
    for (const tab of Object.keys(EMAILS)) if (EMAILS[tab]?.templates[key]) return doc[tab]?.[key] as EmailTemplate;
    throw new Error(`unknown e-mail template: ${key}`);
  };
  return { common: doc.common, template };
}
export type EmailTextsRead = Awaited<ReturnType<typeof emailTexts>>;
