import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

// The ÁSZF the checkout links to (/aszf, /aszf#lemondasi-feltetelek): a placeholder text for
// Morpheus to replace in the admin (Jogi dokumentumok → Általános Szerződési Feltételek). The
// "Lemondási feltételek" section describes what the site actually does (lib/applications, lib/payments).
const text = (t: string, format = 0) => ({ type: 'text', text: t, format, detail: 0, mode: 'normal', style: '', version: 1 });
const p = (t: string, format = 0) => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: null,
  textFormat: format,
  textStyle: '',
  children: [text(t, format)],
});
const h2 = (t: string) => ({
  type: 'heading',
  tag: 'h2',
  format: '',
  indent: 0,
  version: 1,
  direction: null,
  children: [text(t)],
});

const body = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: null,
    children: [
      p('Ideiglenes szöveg — a Morpheus Színműhely a végleges Általános Szerződési Feltételekre cseréli.', 1),
      h2('A szolgáltató'),
      p('Morpheus Színjátszó Egyesület — székhely, nyilvántartási szám, adószám, elérhetőség: kitöltendő.'),
      h2('Jelentkezés és fizetés'),
      p(
        'A Nyitott Műhely alkalmaira és a kezdő kurzusokra a weboldalon lehet jelentkezni, online fizetéssel. A helyet a fizetés idejére (alapesetben 30 percig) megtartjuk; ha a fizetés addig nem érkezik meg, a hely felszabadul. A sikeres fizetésről e-mailben visszaigazolást és számlát küldünk.',
      ),
      h2('Lemondási feltételek'),
      p(
        'Nyitott Műhely: a jelentkezés legkésőbb 24 órával az alkalom kezdése előtt mondható le a fiókban. Ilyenkor a befizetett összeg kreditként marad a fiókodban, és későbbi jelentkezésre fordítható. Ezután lemondani nem lehet.',
      ),
      p(
        'Ha 48 órával az alkalom kezdése előtt nincs meg a minimális létszám, az alkalom elmarad: a résztvevők a teljes befizetett összeget kreditként kapják vissza, és egy kattintással áthelyezhetik másik időpontra.',
      ),
      p('Pénzbeli visszatérítést kérésre, egyedi elbírálás alapján adunk: írj nekünk.'),
      h2('Kredit'),
      p('A kredit a fiókodban látható, és a következő jelentkezéseknél automatikusan felhasználható. Felhasználhatóság ideje: kitöltendő.'),
      h2('Panaszkezelés'),
      p('Kitöltendő.'),
    ],
  },
};

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const exists = await payload.find({ collection: 'legalPages', where: { slug: { equals: 'aszf' } }, limit: 1, req });
  const doc =
    exists.docs[0] ??
    (await payload.create({
      collection: 'legalPages',
      data: { title: 'Általános Szerződési Feltételek', slug: 'aszf', body: body as never, _status: 'published' },
      req,
    }));
  const page = await payload.find({ collection: 'pages', where: { path: { equals: '/aszf' } }, limit: 1, req });
  if (!page.docs.length)
    await payload.create({
      collection: 'pages',
      data: {
        title: 'ÁSZF',
        path: '/aszf',
        layout: 'site',
        meta: {
          title: 'Általános Szerződési Feltételek — Morpheus Színműhely',
          description: 'A jelentkezés, a fizetés és a lemondás feltételei.',
        },
        blocks: [{ blockType: 'legalDocument', document: doc.id }],
        _status: 'published',
      } as never,
      req,
    });
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({ collection: 'pages', where: { path: { equals: '/aszf' } }, req });
  await payload.delete({ collection: 'legalPages', where: { slug: { equals: 'aszf' } }, req });
}
