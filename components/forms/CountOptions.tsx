/** A count select's options: 1 to `max` (at least 1). */
export default function CountOptions({ max }: { max: number }) {
  return Array.from({ length: Math.max(1, max) }, (_, i) => i + 1).map((n) => (
    <option key={n} value={n}>
      {n}
    </option>
  ));
}
