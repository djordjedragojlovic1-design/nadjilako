import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Korisnik } from "@/types/database";

export async function fetchKorisnikByUserUuid(
  supabase: SupabaseClient<Database>,
  userUuid: string,
): Promise<Korisnik | null> {
  const { data, error } = await supabase
    .from("korisnik")
    .select("*")
    .eq("user_uuid", userUuid)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export function getInitials(korisnik: Korisnik): string {
  const i = korisnik.ime?.charAt(0) ?? "";
  const p = korisnik.prezime?.charAt(0) ?? "";
  return (i + p).toUpperCase() || "?";
}
