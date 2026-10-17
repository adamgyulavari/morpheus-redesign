/**
 * Számlázz.hu Számla Agent — ALL Számlázz.hu-specific code lives here: the XML (element names and
 * their order follow the official XSDs, which the Agent enforces), the request and the response.
 * Docs: https://docs.szamlazz.hu/hu/agent — `SZAMLAZZ_AGENT_KEY` only in env.
 */

const ENDPOINT = 'https://www.szamlazz.hu/szamla/';

/** What an invoice says, in our terms (whole forints). */
export type InvoiceData = {
  /** Our id for it, kept by Számlázz.hu (`szamlaKulsoAzon`): the invoice can be found by it. */
  externalId: string;
  /** Our order's reference (`rendelesSzam`). */
  orderRef: string;
  /** YYYY-MM-DD (Budapest) */
  issueDate: string;
  fulfilmentDate: string;
  /** `szamlaszamElotag`: the invoice block's prefix set up in Számlázz.hu (empty: the default). */
  prefix?: string;
  note?: string;
  buyer: {
    name: string;
    /** ISO 3166 alpha-2; HU is left off the invoice */
    country: string;
    zip: string;
    city: string;
    address: string;
    email: string;
    taxNumber?: string;
  };
  items: {
    name: string;
    quantity: number;
    unit: string;
    /** HUF, gross (what the person paid) */
    gross: number;
  }[];
  /** 'AAM' (alanyi adómentes) or a rate */
  vat: VatMode;
};

export type VatMode = 'AAM' | '27' | '18' | '5';

/** Gross → net + VAT, whole forints (AAM: no VAT). */
export function split(gross: number, vat: VatMode) {
  if (vat === 'AAM') return { net: gross, vat: 0, gross };
  const net = Math.round(gross / (1 + Number(vat) / 100));
  return { net, vat: gross - net, gross };
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** `<name>value</name>` lines; empty / undefined values are left out (all such fields are optional). */
const tags = (fields: [string, string | number | boolean | undefined | null][]) =>
  fields
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `<${k}>${typeof v === 'string' ? esc(v) : String(v)}</${k}>`)
    .join('');

const head = (ns: string) =>
  `<?xml version="1.0" encoding="UTF-8"?><${ns} xmlns="http://www.szamlazz.hu/${ns}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.szamlazz.hu/${ns} https://www.szamlazz.hu/szamla/docs/xsds/agent/${ns}.xsd">`;

/** xmlszamla: a paid invoice, e-mailed to the buyer by Számlázz.hu (an e-invoice). */
export function invoiceXml(key: string, d: InvoiceData): string {
  const items = d.items
    .map((i) => {
      const unit = split(i.gross, d.vat);
      const total = split(i.gross * i.quantity, d.vat);
      return `<tetel>${tags([
        ['megnevezes', i.name],
        ['mennyiseg', i.quantity],
        ['mennyisegiEgyseg', i.unit],
        ['nettoEgysegar', unit.net],
        ['afakulcs', d.vat],
        ['nettoErtek', total.net],
        ['afaErtek', total.vat],
        ['bruttoErtek', total.gross],
      ])}</tetel>`;
    })
    .join('');
  return [
    head('xmlszamla'),
    `<beallitasok>${tags([
      ['szamlaagentkulcs', key],
      ['eszamla', true],
      ['szamlaLetoltes', false],
      ['valaszVerzio', 2],
      ['szamlaKulsoAzon', d.externalId],
    ])}</beallitasok>`,
    `<fejlec>${tags([
      ['keltDatum', d.issueDate],
      ['teljesitesDatum', d.fulfilmentDate],
      ['fizetesiHataridoDatum', d.issueDate],
      ['fizmod', 'Bankkártya'],
      ['penznem', 'HUF'],
      ['szamlaNyelve', 'hu'],
      ['megjegyzes', d.note],
      ['rendelesSzam', d.orderRef],
      ['szamlaszamElotag', d.prefix],
      ['fizetve', true],
    ])}</fejlec>`,
    '<elado></elado>',
    `<vevo>${tags([
      ['nev', d.buyer.name],
      ['orszag', d.buyer.country === 'HU' ? undefined : d.buyer.country],
      ['irsz', d.buyer.zip],
      ['telepules', d.buyer.city],
      ['cim', d.buyer.address],
      ['email', d.buyer.email],
      ['sendEmail', true],
      ['adoszam', d.buyer.taxNumber],
    ])}</vevo>`,
    `<tetelek>${items}</tetelek>`,
    '</xmlszamla>',
  ].join('');
}

/** xmlszamlast: a storno (reversal) of an issued invoice, e-mailed to the buyer as well. */
export function stornoXml(
  key: string,
  d: { invoiceNumber: string; externalId: string; issueDate: string; email: string; note?: string },
): string {
  return [
    head('xmlszamlast'),
    `<beallitasok>${tags([
      ['szamlaagentkulcs', key],
      ['eszamla', true],
      ['szamlaLetoltes', false],
      ['valaszVerzio', 2],
      ['szamlaKulsoAzon', d.externalId],
    ])}</beallitasok>`,
    `<fejlec>${tags([
      ['szamlaszam', d.invoiceNumber],
      ['keltDatum', d.issueDate],
      ['teljesitesDatum', d.issueDate],
      ['megjegyzes', d.note],
      ['tipus', 'SS'],
    ])}</fejlec>`,
    `<vevo>${tags([['email', d.email]])}</vevo>`,
    '</xmlszamlast>',
  ].join('');
}

/** xmlszamlapdf: an invoice's PDF, by its number. */
export const pdfXml = (key: string, invoiceNumber: string) =>
  [
    head('xmlszamlapdf'),
    tags([
      ['szamlaagentkulcs', key],
      ['szamlaszam', invoiceNumber],
      ['valaszVerzio', 1],
    ]),
    '</xmlszamlapdf>',
  ].join('');

export type AgentResult = { ok: true; number: string } | { ok: false; code: string; message: string };

/**
 * The Agent's answer: the headers carry the outcome (`szlahu_error_code` / `szlahu_error`, or the
 * new number in `szlahu_szamlaszam`); the XML body says the same (`sikeres`, `hibakod`…).
 */
export function readAnswer(headers: Headers, body: string): AgentResult {
  const header = (name: string) => {
    const v = headers.get(name);
    return v ? decodeURIComponent(v.replace(/\+/g, ' ')) : '';
  };
  const tag = (name: string) => new RegExp(`<${name}>([^<]*)</${name}>`).exec(body)?.[1]?.trim() ?? '';
  const code = header('szlahu_error_code') || (tag('sikeres') === 'false' ? tag('hibakod') || '?' : '');
  if (code) return { ok: false, code, message: header('szlahu_error') || tag('hibauzenet') || body.slice(0, 300) };
  const number = header('szlahu_szamlaszam') || tag('szamlaszam');
  if (!number) return { ok: false, code: 'no-number', message: body.slice(0, 300) || 'empty answer' };
  return { ok: true, number };
}

/** One Agent call: the XML as a multipart file in the action's field. */
async function call(field: string, xml: string): Promise<Response> {
  const form = new FormData();
  form.append(field, new Blob([xml], { type: 'text/xml; charset=utf-8' }), 'request.xml');
  return fetch(ENDPOINT, { method: 'POST', body: form, signal: AbortSignal.timeout(30_000) });
}

export async function createInvoice(key: string, d: InvoiceData): Promise<AgentResult> {
  const res = await call('action-xmlagentxmlfile', invoiceXml(key, d));
  return readAnswer(res.headers, await res.text());
}

export async function createStorno(key: string, d: Parameters<typeof stornoXml>[1]): Promise<AgentResult> {
  const res = await call('action-szamla_agent_st', stornoXml(key, d));
  return readAnswer(res.headers, await res.text());
}

/** The PDF (null: Számlázz.hu answered with an error instead). */
export async function invoicePdf(key: string, invoiceNumber: string): Promise<Uint8Array | null> {
  const res = await call('action-szamla_agent_pdf', pdfXml(key, invoiceNumber));
  if (res.headers.get('szlahu_error_code') || !res.headers.get('content-type')?.includes('pdf')) return null;
  return new Uint8Array(await res.arrayBuffer());
}
