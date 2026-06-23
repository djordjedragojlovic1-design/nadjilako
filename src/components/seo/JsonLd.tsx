type JsonLdData = Record<string, unknown> | Record<string, unknown>[];

/**
 * Ubacuje structured data (schema.org) u stranicu.
 * Renderuje se na serveru, vidljivo je pretraživačima u inicijalnom HTML-u.
 */
export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      // Sadržaj je serijalizovan JSON, ne korisnički HTML.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
