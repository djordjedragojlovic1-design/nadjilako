import type { MjestaRadaJson } from "@/lib/lokacije/types";
import type { Promocija } from "./constants";

export type MjestaRada = MjestaRadaJson;

export type UslugaRow = {
  id: number;
  korisnik_id: number;
  kategorija_id: number | null;
  tip: string | null;
  promocija?: Promocija | string | null;
  promovisano_do?: string | null;
  promovisano_od?: string | null;
  naziv: string;
  informacije: string | null;
  status: string;
  mjesta_rada: MjestaRadaJson | null;
  cijena: number | null;
  tip_cijene: string | null;
  valuta: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
};

export type SlikaRow = {
  id?: number;
  slika_url: string;
  sort_order: number | null;
};

export type UslugaSlika = {
  id: number;
  url: string;
  sort_order: number | null;
};

export type UslugaListItem = {
  id: number;
  naziv: string;
  informacije: string | null;
  promocija: Promocija;
  created_at: string;
  slikaUrl: string | null;
  prosecnaOcjena: number;
  brojRecenzija: number;
  cijena: number | null;
  tip_cijene: string | null;
  valuta: string | null;
};

export type UslugaDetail = UslugaRow & {
  promocija: Promocija;
  mjesta: MjestaRada;
  slike: string[];
  slikeRows: UslugaSlika[];
  prosecnaOcjena: number;
  brojRecenzija: number;
  pruzalac: {
    id: number;
    ime: string;
    prezime: string;
    korisnicko_ime: string;
    profilna_slika: string | null;
  } | null;
};

export type KategorijaDijete = {
  id: number;
  naziv: string;
  slug: string;
  brojUsluga: number;
};

export type KategorijaCvor = {
  id: number;
  naziv: string;
  slug: string;
  brojUsluga: number;
  ukupnoUsluga: number;
  djeca: KategorijaDijete[];
};

export type FacetBroj = {
  value: string;
  count: number;
};

export type KategorijaFacet = {
  slug: string;
  naziv: string;
  parentNaziv: string | null;
  count: number;
};

export type OcjenaFacet = {
  value: number;
  count: number;
};

export type PretragaFacets = {
  drzave: FacetBroj[];
  gradovi: FacetBroj[];
  kategorije: KategorijaFacet[];
  tipovi: FacetBroj[];
  ocjene: OcjenaFacet[];
};

export type PretragaFilteriValues = {
  q: string;
  kategorija: string | null;
  drzava: string | null;
  grad: string | null;
  tip: string | null;
  valuta: string;
  cijenaMin: number | null;
  cijenaMax: number | null;
  ocjena: number | null;
};

export type PretragaRezultat = {
  items: UslugaListItem[];
  total: number;
  page: number;
  totalPages: number;
  kategorija: { naziv: string; slug: string } | null;
  facets: PretragaFacets;
};

export type Recenzent = {
  id: number;
  ime: string;
  prezime: string;
  korisnicko_ime: string;
  profilna_slika: string | null;
};

export type OdgovorItem = {
  id: number;
  komentar: string;
  created_at: string;
  ocjenjivac: Recenzent;
};

export type RecenzijaItem = {
  id: number;
  ocjena: number;
  komentar: string | null;
  slika: string | null;
  created_at: string;
  ocjenjivac: Recenzent;
  odgovori: OdgovorItem[];
};

export type KorisnikReviewStats = {
  prosecnaOcjena: number;
  brojRecenzija: number;
};
