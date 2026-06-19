import { createClient } from "@/lib/supabase/server";
import type { KreditTransakcija } from "@/types/database";

export async function fetchKreditTransakcije(
  korisnikId: number,
  limit = 50,
): Promise<KreditTransakcija[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kredit_transakcije")
    .select("*")
    .eq("korisnik_id", korisnikId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as KreditTransakcija[];
}
