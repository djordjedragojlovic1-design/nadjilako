export const PROMOCIJE = ["izdvojeno+", "izdvojeno"] as const;
export type Promocija = (typeof PROMOCIJE)[number] | null;

export const STATUS_LABELS: Record<string, string> = {
  aktivno: "Aktivno — usluga se i dalje pruža",
  pauzirano: "Pauzirano — privremeno nedostupno",
  zavrseno: "Završeno — usluga se više ne pruža",
  neaktivno: "Neaktivno",
};

export const TIP_CIJENE_LABELS: Record<string, string> = {
  sat: "po satu",
  dan: "po danu",
  mjesecno: "mjesečno",
  kvadrat: "po m²",
  komad: "po komadu",
  projekat: "po projektu",
  dogovor: "dogovor",
};

export const VALUTA_LABELS: Record<string, string> = {
  BAM: "KM",
  EUR: "€",
  RSD: "RSD",
};

export const IZDVJENO_INITIAL = 30;
export const IZDVJENO_STEP = 10;
export const IZDVJENO_MAX = 100;

export const PRETRAGA_PER_PAGE = 20;

export const SORT_OPCIJE = [
  { value: "preporuceno", label: "Preporučeno" },
  { value: "ocjena_desc", label: "Najbolje ocijenjene" },
  { value: "ocjena_asc", label: "Najgore ocijenjene" },
  { value: "cijena_asc", label: "Cijena: rastuće" },
  { value: "cijena_desc", label: "Cijena: opadajuće" },
  { value: "datum_desc", label: "Najnovije" },
  { value: "datum_asc", label: "Najstarije" },
] as const;

export type UslugaSortKey = (typeof SORT_OPCIJE)[number]["value"];

export const DEFAULT_SORT: UslugaSortKey = "preporuceno";

export function isSortKey(value: string | null | undefined): value is UslugaSortKey {
  return SORT_OPCIJE.some((o) => o.value === value);
}

// Fiksni kursevi za interno poređenje cijena (svedeno na KM / BAM).
// KM je vezana za EUR (1 € = 1.95583 KM). RSD je približan i mijenja se vremenom.
export const KURS_U_BAM: Record<string, number> = {
  BAM: 1,
  EUR: 1.95583,
  RSD: 0.0167,
};

export const DEFAULT_VALUTA = "BAM";

export const MIN_OCJENA_OPCIJE = [4, 3, 2] as const;
export type MinOcjena = (typeof MIN_OCJENA_OPCIJE)[number];

export const STATUS_OPTIONS = ["aktivno", "pauzirano", "zavrseno"] as const;

export const TIP_CIJENE_OPTIONS = ["sat", "dan", "mjesecno", "kvadrat", "komad", "projekat", "dogovor"] as const;

export const VALUTA_OPTIONS = ["BAM", "EUR", "RSD"] as const;

export const USLUGE_SLIKE_BUCKET = "usluge-slike";
export const SLIKE_MAX_COUNT = 5;
// Ciljana maksimalna veličina slike nakon kompresije (~200 KB) radi uštede memorije.
export const SLIKA_TARGET_MAX_BYTES = 200 * 1024;
export const SLIKA_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/heic",
  "image/heif",
] as const;
