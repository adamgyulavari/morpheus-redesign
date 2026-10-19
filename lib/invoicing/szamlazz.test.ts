import { describe, expect, it } from 'vitest';

import { type InvoiceData, invoiceXml, pdfXml, readAnswer, split, stornoXml } from './szamlazz';

const invoice: InvoiceData = {
  externalId: 'order-12',
  orderRef: '#12',
  issueDate: '2026-10-17',
  fulfilmentDate: '2026-10-16',
  note: 'Online fizetve bankkártyával (rendelés #12).',
  buyer: {
    name: 'Kovács & Társa <Kft>',
    country: 'HU',
    zip: '1027',
    city: 'Budapest',
    address: 'Frankel Leó út 1.',
    email: 'anna@example.com',
  },
  items: [{ name: 'Nyitott Műhely — okt. 25.', quantity: 1, unit: 'alkalom', gross: 5000 }],
  vat: 'AAM',
};

describe('split', () => {
  it('AAM: no VAT', () => expect(split(5000, 'AAM')).toEqual({ net: 5000, vat: 0, gross: 5000 }));
  it('27%: whole forints that add up', () => {
    expect(split(5000, '27')).toEqual({ net: 3937, vat: 1063, gross: 5000 });
    const s = split(12345, '5');
    expect(s.net + s.vat).toBe(12345);
  });
});

describe('invoiceXml', () => {
  it('escapes text and leaves HU off the buyer', () => {
    const xml = invoiceXml('KEY', invoice);
    expect(xml).toContain('<nev>Kovács &amp; Társa &lt;Kft&gt;</nev>');
    expect(xml).not.toContain('<orszag>');
    expect(xml).toContain('<afakulcs>AAM</afakulcs><nettoErtek>5000</nettoErtek><afaErtek>0</afaErtek>');
    expect(xml).toContain('<szamlaKulsoAzon>order-12</szamlaKulsoAzon>');
  });
  it('a transfer invoice: unpaid, Átutalás, its due date', () => {
    const xml = invoiceXml('KEY', { ...invoice, payment: { method: 'transfer', dueDate: '2026-10-25' } });
    expect(xml).toContain('<fizetesiHataridoDatum>2026-10-25</fizetesiHataridoDatum><fizmod>Átutalás</fizmod>');
    expect(xml).toContain('<fizetve>false</fizetve>');
    expect(invoiceXml('KEY', invoice)).toContain('<fizmod>Bankkártya</fizmod>');
  });
});

describe('stornoXml / pdfXml', () => {
  it('storno: the invoice reversed, SS type', () => {
    const xml = stornoXml('KEY', {
      invoiceNumber: 'MSZ-2026-1',
      externalId: 'storno-3',
      issueDate: '2026-10-17',
      email: 'anna@example.com',
      note: 'Visszatérítés',
    });
    expect(xml).toContain('<szamlaszam>MSZ-2026-1</szamlaszam>');
    expect(xml).toContain('<tipus>SS</tipus>');
  });
  it('pdf: the invoice number', () => {
    expect(pdfXml('KEY', 'MSZ-2026-1')).toContain('<szamlaszam>MSZ-2026-1</szamlaszam>');
  });
});

describe('readAnswer', () => {
  it('the number from the header (URL-encoded)', () => {
    const h = new Headers({ szlahu_szamlaszam: 'MSZ-2026-12', szlahu_bruttovegosszeg: '5000' });
    expect(readAnswer(h, '<xmlszamlavalasz><sikeres>true</sikeres></xmlszamlavalasz>')).toEqual({
      ok: true,
      number: 'MSZ-2026-12',
    });
  });
  it('an error from the headers', () => {
    const h = new Headers({ szlahu_error_code: '3', szlahu_error: 'Bejelentkez%C3%A9si+hiba' });
    expect(readAnswer(h, '')).toEqual({ ok: false, code: '3', message: 'Bejelentkezési hiba' });
  });
  it('an error only in the XML body', () => {
    const body =
      '<xmlszamlavalasz><sikeres>false</sikeres><hibakod>57</hibakod><hibauzenet>Hiba</hibauzenet></xmlszamlavalasz>';
    expect(readAnswer(new Headers(), body)).toEqual({ ok: false, code: '57', message: 'Hiba' });
  });
  it('no number, no error: not a success', () => {
    expect(readAnswer(new Headers(), '').ok).toBe(false);
  });
});
