import { createClient } from "@/lib/supabase/server";
import type { UslugaListItem } from "@/lib/usluge/types";
import {
  buildReviewStats,
  getReviewAverage,
  getReviewCount,
  normalizePromocija,
  pickCoverImage,
  truncateText,
} from "@/lib/usluge/utils";

type SacuvanaUsluga = {
  id: number;
  naziv: string;
  informacije: string | null;
  tip: string | null;
  promocija?: string | null;
  promovisano_do?: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
  cijena: number | null;
  tip_cijene: string | null;
  valuta: string | null;
  slike: { id: number; slika_url: string; sort_order: number | null }[] | null;
};

function uslugaKolone(saPromocijom: boolean): string {
  return `
    usluga:usluga_id (
      id,
      naziv,
      informacije,
      tip,
      ${saPromocijom ? "promocija, promovisano_do," : ""}
      status,
      expires_at,
      created_at,
      cijena,
      tip_cijene,
      valuta,
      slike ( id, slika_url, sort_order )
    )
  `;
}

/** Da li je viewer sačuvao datu uslugu. */
export async function fetchDaLiSacuvano(
  korisnikId: number,
  uslugaId: number,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sacuvane_objave")
    .select("id")
    .eq("korisnik_id", korisnikId)
    .eq("usluga_id", uslugaId)
    .maybeSingle();

  if (error) throw error;
  return data != null;
}

/** Sve usluge koje je viewer sačuvao (vidi samo vlasnik — RLS). */
export async function fetchSacuvaneObjave(
  korisnikId: number,
): Promise<UslugaListItem[]> {
  const supabase = await createClient();

  const build = (saPromocijom: boolean) =>
    supabase
      .from("sacuvane_objave")
      .select(uslugaKolone(saPromocijom))
      .eq("korisnik_id", korisnikId)
      .order("created_at", { ascending: false });

  let { data, error } = await build(true);
  if (error?.message.includes("promocija")) {
    const fallback = await build(false);
    data = fallback.data;
    error = fallback.error;
  }
  if (error) throw error;

  const usluge = ((data ?? []) as unknown as { usluga: SacuvanaUsluga | null }[])
    .map((r) => r.usluga)
    .filter((u): u is SacuvanaUsluga => u != null);

  if (usluge.length === 0) return [];

  const { data: recenzije, error: recError } = await supabase
    .from("recenzije")
    .select("usluga_id, ocjena")
    .is("parent_id", null)
    .in(
      "usluga_id",
      usluge.map((u) => u.id),
    );
  if (recError) throw recError;

  const stats = buildReviewStats(recenzije ?? []);

  return usluge.map((u) => ({
    id: u.id,
    naziv: u.naziv,
    informacije: truncateText(u.informacije),
    promocija: normalizePromocija(u.promocija, u.tip, u.promovisano_do),
    created_at: u.created_at,
    slikaUrl: pickCoverImage(u.slike),
    prosecnaOcjena: getReviewAverage(stats, u.id),
    brojRecenzija: getReviewCount(stats, u.id),
    cijena: u.cijena != null ? Number(u.cijena) : null,
    tip_cijene: u.tip_cijene ?? null,
    valuta: u.valuta ?? null,
  }));
}
