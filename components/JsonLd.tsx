/** Structured data (lib/structured-data) as a <script> tag; `<` escaped so content can't close it. */
export default function JsonLd({ data }: { data: object | object[] }) {
  if (Array.isArray(data) && data.length === 0) return null;
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON, with "<" escaped
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
