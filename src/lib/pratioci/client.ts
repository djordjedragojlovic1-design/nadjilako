import { createClient } from "@/lib/supabase/client";

export type PratiociResult = { error?: string };

/** Viewer (pratilacId) zaprati nalog korisnikId. */
export async function zapratiClient(
  korisnikId: number,
  pratilacId: number,
): Promise<PratiociResult> {
  if (korisnikId === pratilacId) {
    return { error: "Ne možete pratiti sami sebe." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("pratioci")
    .insert({ korisnik_id: korisnikId, pratilac_id: pratilacId });

  if (error) {
    // 23505 = duplikat (već prati) — tretiramo kao uspjeh
    if (error.code === "23505") return {};
    return { error: error.message };
  }
  return {};
}

/** Viewer (pratilacId) otprati nalog korisnikId. */
export async function otpratiClient(
  korisnikId: number,
  pratilacId: number,
): Promise<PratiociResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("pratioci")
    .delete()
    .eq("korisnik_id", korisnikId)
    .eq("pratilac_id", pratilacId);

  if (error) return { error: error.message };
  return {};
}
