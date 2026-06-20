import { createClient } from "@/lib/supabase/client";

export type SacuvaneResult = { error?: string };

export async function sacuvajObjavuClient(
  korisnikId: number,
  uslugaId: number,
): Promise<SacuvaneResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("sacuvane_objave")
    .insert({ korisnik_id: korisnikId, usluga_id: uslugaId });

  if (error) {
    // 23505 = duplikat (već sačuvano) — tretiramo kao uspjeh
    if (error.code === "23505") return {};
    return { error: error.message };
  }
  return {};
}

export async function ukloniSacuvanuClient(
  korisnikId: number,
  uslugaId: number,
): Promise<SacuvaneResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("sacuvane_objave")
    .delete()
    .eq("korisnik_id", korisnikId)
    .eq("usluga_id", uslugaId);

  if (error) return { error: error.message };
  return {};
}
