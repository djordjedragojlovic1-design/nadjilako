import { createClient } from "@/lib/supabase/server";
import type { PratiociKorisnik } from "./types";

const KORISNIK_KOLONE = "id, ime, prezime, korisnicko_ime, profilna_slika";

export async function fetchBrojPratilaca(korisnikId: number): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("broj_pratilaca", {
    p_korisnik_id: korisnikId,
  });
  if (error) throw error;
  return data ?? 0;
}

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
