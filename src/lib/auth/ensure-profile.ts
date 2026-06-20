import type { SupabaseClient, User } from "@supabase/supabase-js";
import { mapAuthError } from "@/lib/auth/messages";
import { isDrzava } from "@/lib/auth/validation";
import type { Database } from "@/types/database";

export type KorisnikProfileInput = {
  ime: string;
  prezime: string;
  korisnicko_ime: string;
  drzava: string;
};

type SignUpUserMetadata = {
  ime?: string;
  prezime?: string;
  korisnicko_ime?: string;
  drzava?: string;
};

function profileFromUserMetadata(user: User): KorisnikProfileInput | null {
  const meta = user.user_metadata as SignUpUserMetadata;
  const ime = meta.ime?.trim();
  const prezime = meta.prezime?.trim();
  const korisnicko_ime = meta.korisnicko_ime?.trim();
  const drzava = meta.drzava?.trim();

  if (!ime || !prezime || !korisnicko_ime || !drzava || !isDrzava(drzava)) {
    return null;
  }

  return { ime, prezime, korisnicko_ime, drzava };
}

export async function createKorisnikProfileIfMissing(
  supabase: SupabaseClient<Database>,
  userUuid: string,
  profile: KorisnikProfileInput,
): Promise<{ error: string | null }> {
  const { data: existing } = await supabase
    .from("korisnik")
    .select("id")
    .eq("user_uuid", userUuid)
    .maybeSingle();

  if (existing) {
    return { error: null };
  }

  const { error: profileError } = await supabase.from("korisnik").insert({
    user_uuid: userUuid,
    ime: profile.ime,
    prezime: profile.prezime,
    korisnicko_ime: profile.korisnicko_ime,
    drzava: profile.drzava,
    is_active: true,
    is_verified: false,
  });

  if (profileError) {
    return { error: mapAuthError(profileError.message) };
  }

  return { error: null };
}

export async function ensureKorisnikProfileForUser(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<{ error: string | null }> {
  const profile = profileFromUserMetadata(user);
  if (!profile) {
    return {
      error:
        "Profil nije pronađen i nije moguće kreirati ga automatski. Kontaktirajte podršku.",
    };
  }

  return createKorisnikProfileIfMissing(supabase, user.id, profile);
}
