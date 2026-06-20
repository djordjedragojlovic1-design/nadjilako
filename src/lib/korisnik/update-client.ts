import { mapAuthError } from "@/lib/auth/messages";
import { isDrzava } from "@/lib/auth/validation";
import { isGoogleMapsUrl } from "@/lib/lokacije/maps";
import { isValidBrojTelefona } from "@/lib/telefon/pozivni";
import { compressImageFile } from "@/lib/usluge/compress-image";
import { USLUGE_SLIKE_BUCKET } from "@/lib/usluge/constants";
import { createClient } from "@/lib/supabase/client";

export type UpdateProfilPayload = {
  ime: string;
  prezime: string;
  korisnicko_ime: string;
  inf_o_korisniku: string;
  drzava: string;
  lokacija: string;
  brojTelefona: string;
  trenutniBrojTelefona: string | null;
  avatarFile: File | null;
  ukloniAvatar: boolean;
  trenutniEmail: string;
  email: string;
  novaLozinka: string;
  potvrdaLozinke: string;
};

export type UpdateProfilResult = {
  error?: string;
  success?: string;
  profilna_slika?: string | null;
};

function validateProfil(payload: UpdateProfilPayload): string | null {
  if (!payload.ime.trim() || !payload.prezime.trim()) {
    return "Unesite ime i prezime.";
  }
  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(payload.korisnicko_ime)) {
    return "Korisničko ime mora imati 3–30 karaktera (slova, brojevi, _, ., -).";
  }
  if (!isDrzava(payload.drzava)) {
    return "Izaberite validnu državu.";
  }
  if (payload.brojTelefona && !isValidBrojTelefona(payload.brojTelefona)) {
    return "Unesite ispravan broj telefona (npr. 066 123 456).";
  }
  if (payload.lokacija.trim() && !isGoogleMapsUrl(payload.lokacija.trim())) {
    return "Unesite ispravan Google Maps link za lokaciju.";
  }
  if (!payload.email.trim()) {
    return "Unesite email adresu.";
  }
  if (payload.novaLozinka) {
    if (payload.novaLozinka.length < 6) {
      return "Lozinka mora imati najmanje 6 karaktera.";
    }
    if (payload.novaLozinka !== payload.potvrdaLozinke) {
      return "Lozinke se ne podudaraju.";
    }
  }
  return null;
}

async function uploadAvatar(
  userUuid: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  let compressed: File;
  try {
    compressed = await compressImageFile(file);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Kompresija slike nije uspjela.",
    };
  }

  const supabase = createClient();
  const path = `${userUuid}/avatari/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from(USLUGE_SLIKE_BUCKET)
    .upload(path, compressed, {
      upsert: false,
      contentType: "image/jpeg",
    });

  if (error) return { error: error.message };

  const { data } = supabase.storage
    .from(USLUGE_SLIKE_BUCKET)
    .getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function updateProfilClient(
  korisnikId: number,
  userUuid: string,
  payload: UpdateProfilPayload,
): Promise<UpdateProfilResult> {
  const validationError = validateProfil(payload);
  if (validationError) return { error: validationError };

  const supabase = createClient();

  const { data: existing, error: existingError } = await supabase
    .from("korisnik")
    .select("id")
    .eq("korisnicko_ime", payload.korisnicko_ime)
    .maybeSingle();

  if (existingError) return { error: existingError.message };
  if (existing && existing.id !== korisnikId) {
    return { error: "Korisničko ime je već zauzeto." };
  }

  let profilna_slika: string | null | undefined;
  if (payload.avatarFile) {
    const { url, error: uploadError } = await uploadAvatar(
      userUuid,
      payload.avatarFile,
    );
    if (uploadError) {
      return { error: `Slika nije uploadovana: ${uploadError}` };
    }
    profilna_slika = url;
  } else if (payload.ukloniAvatar) {
    profilna_slika = null;
  }

  const noviBroj = payload.brojTelefona.trim() || null;
  const brojPromijenjen =
    (noviBroj ?? "") !== (payload.trenutniBrojTelefona ?? "");

  const { data: updated, error: updateError } = await supabase
    .from("korisnik")
    .update({
      ime: payload.ime.trim(),
      prezime: payload.prezime.trim(),
      korisnicko_ime: payload.korisnicko_ime.trim(),
      inf_o_korisniku: payload.inf_o_korisniku.trim() || null,
      drzava: payload.drzava,
      lokacija: payload.lokacija.trim() || null,
      broj_telefona: noviBroj,
      // Promjena broja poništava prethodnu verifikaciju
      ...(brojPromijenjen ? { telefon_verifikovan: false } : {}),
      ...(profilna_slika !== undefined ? { profilna_slika } : {}),
    })
    .eq("id", korisnikId)
    .select("id")
    .maybeSingle();

  if (updateError) return { error: mapAuthError(updateError.message) };
  if (!updated) {
    return {
      error:
        "Izmjene nisu sačuvane. Nemate dozvolu za ažuriranje ovog profila (provjerite RLS UPDATE politiku na tabeli korisnik).",
    };
  }

  const emailPromijenjen =
    payload.email.trim().toLowerCase() !==
    payload.trenutniEmail.trim().toLowerCase();

  if (emailPromijenjen) {
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000");

    const { error: emailError } = await supabase.auth.updateUser(
      { email: payload.email.trim() },
      { emailRedirectTo: `${origin}/auth/callback` },
    );
    if (emailError) {
      return {
        error: `Profil je sačuvan, ali promjena emaila nije uspjela: ${mapAuthError(emailError.message)}`,
      };
    }
  }

  if (payload.novaLozinka) {
    const { error: passwordError } = await supabase.auth.updateUser({
      password: payload.novaLozinka,
    });
    if (passwordError) {
      return {
        error: `Profil je sačuvan, ali promjena lozinke nije uspjela: ${mapAuthError(passwordError.message)}`,
      };
    }
  }

  if (emailPromijenjen) {
    return {
      success:
        "Profil je sačuvan. Provjerite oba emaila (staru i novu adresu) da potvrdite promjenu.",
      profilna_slika,
    };
  }

  return { success: "Profil je uspješno sačuvan.", profilna_slika };
}
