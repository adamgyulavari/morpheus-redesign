import type { PriceOption } from './types';

/** 140000 → "140 000 Ft" (Hungarian grouping uses a non-breaking space). */
export function formatHuf(amount: number): string {
  return `${new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(amount)} Ft`;
}

/** Price for a course card / fact: "140 000 Ft-tól" when there are options, "45 000 Ft / hó" for a single recurring fee. */
export function priceSummary(prices: PriceOption[]): string {
  if (prices.length === 0) return '';
  const lowest = prices.reduce((min, p) => (p.amount < min.amount ? p : min));
  if (prices.length === 1) return lowest.per ? `${formatHuf(lowest.amount)} / ${lowest.per}` : formatHuf(lowest.amount);
  return `${formatHuf(lowest.amount)}-tól`;
}

/** "+36304639129" → "+36 30 463 9129" (Hungarian mobile numbers). */
export function formatPhone(e164: string): string {
  const m = e164.match(/^\+36(\d{2})(\d{3})(\d{4})$/);
  return m ? `+36 ${m[1]} ${m[2]} ${m[3]}` : e164;
}

/** Fills "{name}" placeholders in a content string. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
}
