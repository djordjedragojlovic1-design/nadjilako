import { createClient } from "@/lib/supabase/server";
import type { Korisnik } from "@/types/database";

export type KorisnikProfil = Korisnik & { id: number };

export async function fetchKorisnikById(
  id: number,
): Promise<KorisnikProfil | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("korisnik")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data as KorisnikProfil;
}

export async function fetchKorisnikByUserUuid(
  userUuid: string,
): Promise<KorisnikProfil | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("korisnik")
    .select("*")
    .eq("user_uuid", userUuid)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data as KorisnikProfil;
}

export async function resolveProfilId(idParam: string): Promise<number | null> {
  const numericId = Number(idParam);
  if (!Number.isNaN(numericId)) return numericId;

  const supabase = await createClient();
  const { data } = await supabase
    .from("korisnik")
    .select("id")
    .eq("user_uuid", idParam)
    .maybeSingle();

  return data?.id ?? null;
}

export async function getViewerKorisnikId(): Promise<number | null> {
  const korisnik = await getViewerKorisnik();
  return korisnik?.id ?? null;
}

export async function getViewerKorisnik(): Promise<{
  id: number;
  user_uuid: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const korisnik = await fetchKorisnikByUserUuid(user.id);
  if (!korisnik) return null;

  return { id: korisnik.id, user_uuid: korisnik.user_uuid };
}
