import { createClient } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/auth/messages";
import {
  getString,
  validateSignIn,
  validateSignUp,
  type AuthFormState,
} from "@/lib/auth/validation";

export type { AuthFormState };

export async function signInClient(formData: FormData): Promise<AuthFormState> {
  const email = getString(formData, "email");
  const lozinka = getString(formData, "lozinka");

  const validationError = validateSignIn(email, lozinka);
  if (validationError) return validationError;

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: lozinka,
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return {};
}

export async function signUpClient(formData: FormData): Promise<AuthFormState> {
  const ime = getString(formData, "ime");
  const prezime = getString(formData, "prezime");
  const korisnickoIme = getString(formData, "korisnicko_ime");
  const email = getString(formData, "email");
  const lozinka = getString(formData, "lozinka");
  const drzavaRaw = getString(formData, "drzava");

  const validationError = validateSignUp({
    ime,
    prezime,
    korisnickoIme,
    email,
    lozinka,
    drzavaRaw,
  });
  if (validationError) return validationError;

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("korisnik")
    .select("id")
    .eq("korisnicko_ime", korisnickoIme)
    .maybeSingle();

  if (existing) {
    return { error: "Korisničko ime je već zauzeto." };
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: lozinka,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        ime,
        prezime,
        korisnicko_ime: korisnickoIme,
        drzava: drzavaRaw,
      },
    },
  });

  if (signUpError) {
    return { error: mapAuthError(signUpError.message) };
  }

  const user = authData.user;
  if (!user) {
    return { error: "Registracija nije uspela. Pokušajte ponovo." };
  }

  const { error: profileError } = await supabase.from("korisnik").insert({
    user_uuid: user.id,
    ime,
    prezime,
    korisnicko_ime: korisnickoIme,
    drzava: drzavaRaw,
    is_active: true,
    is_verified: false,
  });

  if (profileError) {
    return { error: mapAuthError(profileError.message) };
  }

  if (authData.session) {
    return {};
  }

  return {
    success:
      "Nalog je kreiran. Proverite email i potvrdite adresu, zatim se prijavite.",
  };
}

export async function signOutClient(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
