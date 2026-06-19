import { parseMjestaRada } from "@/lib/lokacije/utils";
import type { UslugaRow } from "./types";
import type { Promocija } from "./constants";
import { KURS_U_BAM, PROMOCIJE, USLUGE_SLIKE_BUCKET } from "./constants";

const PLACEHOLDER_IMAGE = "/placeholder-usluga.svg";

export { parseMjestaRada };

export function resolveSlikaUrl(url: string): string {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return url;

  return `${base}/storage/v1/object/public/${USLUGE_SLIKE_BUCKET}/${url}`;
}

export function normalizePromocija(
  promocija: string | null | undefined,
  tip: string | null | undefined,
  promovisanoDo?: string | null,
): Promocija {
  const value = promocija ?? tip;
  if (value !== "izdvojeno+" && value !== "izdvojeno") return null;
  // Istekla promocija gubi oznaku (usluga ostaje aktivna).
  if (promovisanoDo != null && new Date(promovisanoDo) <= new Date()) {
    return null;
  }
  return value;
}

export function isPromocija(value: string | null | undefined): value is Promocija {
  return value === "izdvojeno+" || value === "izdvojeno";
}

export function pickCoverImage(
  slike: { slika_url: string; sort_order: number | null }[] | null | undefined,
): string {
  if (!slike?.length) return PLACEHOLDER_IMAGE;
  const sorted = [...slike].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  return sorted[0]?.slika_url ? resolveSlikaUrl(sorted[0].slika_url) : PLACEHOLDER_IMAGE;
}

export function truncateText(text: string | null, max = 120): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export function formatDatum(iso: string): string {
  return new Intl.DateTimeFormat("sr-Latn-BA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatCijena(
  cijena: number | null,
  tipCijene: string | null,
  valuta: string | null,
  labels: Record<string, string>,
): string {
  if (tipCijene === "dogovor") return "Po dogovoru";
  if (cijena == null) return "Cijena na upit";
  const valutaLabel = labels[valuta ?? "BAM"] ?? valuta ?? "KM";
  const tipLabel = tipCijene ? labels[tipCijene] ?? tipCijene : "";
  const amount = new Intl.NumberFormat("sr-Latn-BA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cijena);
  return tipLabel ? `${amount} ${valutaLabel} ${tipLabel}` : `${amount} ${valutaLabel}`;
}

/** Cijena svedena na baznu valutu (KM/BAM) radi poređenja i sortiranja. */
export function cijenaUBAM(
  cijena: number | null,
  valuta: string | null,
): number | null {
  if (cijena == null) return null;
  const kurs = KURS_U_BAM[valuta ?? "BAM"] ?? 1;
  return cijena * kurs;
}

export type ReviewStats = Map<number, { sum: number; count: number }>;

export function buildReviewStats(
  recenzije: { usluga_id: number | null; ocjena: number | null }[],
): ReviewStats {
  const map: ReviewStats = new Map();
  for (const r of recenzije) {
    if (r.usluga_id == null) continue;
    if (r.ocjena == null) continue;
    const current = map.get(r.usluga_id) ?? { sum: 0, count: 0 };
    current.sum += r.ocjena;
    current.count += 1;
    map.set(r.usluga_id, current);
  }
  return map;
}

export function getReviewAverage(stats: ReviewStats, uslugaId: number): number {
  const s = stats.get(uslugaId);
  if (!s || s.count === 0) return 0;
  return Math.round((s.sum / s.count) * 10) / 10;
}

export function getReviewCount(stats: ReviewStats, uslugaId: number): number {
  return stats.get(uslugaId)?.count ?? 0;
}

export function sortIzdvojenoUsluge<
  T extends { promocija: Promocija; prosecnaOcjena: number; brojRecenzija: number },
>(items: T[]): T[] {
  const promoRank: Record<string, number> = {
    "izdvojeno+": 0,
    izdvojeno: 1,
  };

  return [...items].sort((a, b) => {
    const pa = a.promocija ? (promoRank[a.promocija] ?? 2) : 2;
    const pb = b.promocija ? (promoRank[b.promocija] ?? 2) : 2;
    if (pa !== pb) return pa - pb;
    if (b.prosecnaOcjena !== a.prosecnaOcjena) {
      return b.prosecnaOcjena - a.prosecnaOcjena;
    }
    return b.brojRecenzija - a.brojRecenzija;
  });
}

export function isUslugaActive(usluga: Pick<UslugaRow, "status" | "expires_at">): boolean {
  if (usluga.status !== "aktivno") return false;
  if (!usluga.expires_at) return true;
  return new Date(usluga.expires_at) > new Date();
}

export { PLACEHOLDER_IMAGE, PROMOCIJE };
