import { createClient } from "@/lib/supabase/server";
import type { PratiociKorisnik } from "./types";

const KORISNIK_KOLONE = "id, ime, prezime, korisnicko_ime, profilna_slika";

/**
 * Javni broj pratilaca naloga. Koristi SECURITY DEFINER funkciju da bi broj
 * bio vidljiv svima, dok sama lista pratilaca ostaje privatna (RLS).
 */
export async function fetchBrojPratilaca(korisnikId: number): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("broj_pratilaca", {
    p_korisnik_id: korisnikId,
  });
  if (error) throw error;
  return data ?? 0;
}

/** Da li viewer (pratilacId) prati nalog korisnikId. */
export async function fetchDaLiPrati(
  pratilacId: number,
  korisnikId: number,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pratioci")
    .select("id")
    .eq("korisnik_id", korisnikId)
    .eq("pratilac_id", pratilacId)
    .maybeSingle();

  if (error) throw error;
  return data != null;
}

/** Nalozi koji prate dati nalog (vidi samo vlasnik — RLS). */
export async function fetchPratioci(
  korisnikId: number,
): Promise<PratiociKorisnik[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pratioci")
    .select(`pratilac:pratilac_id ( ${KORISNIK_KOLONE} )`)
    .eq("korisnik_id", korisnikId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as { pratilac: PratiociKorisnik | null }[])
    .map((r) => r.pratilac)
    .filter((k): k is PratiociKorisnik => k != null);
}

/** Nalozi koje dati nalog prati (vidi samo vlasnik — RLS). */
export async function fetchPraceni(
  korisnikId: number,
): Promise<PratiociKorisnik[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pratioci")
    .select(`praceni:korisnik_id ( ${KORISNIK_KOLONE} )`)
    .eq("pratilac_id", korisnikId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as { praceni: PratiociKorisnik | null }[])
    .map((r) => r.praceni)
    .filter((k): k is PratiociKorisnik => k != null);
}
