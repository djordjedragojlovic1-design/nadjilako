import { createClient } from "@/lib/supabase/client";
import {
  createKorisnikProfileIfMissing,
  ensureKorisnikProfileForUser,
} from "@/lib/auth/ensure-profile";
import { mapAuthError } from "@/lib/auth/messages";
import { getSiteOrigin } from "@/lib/auth/site-url";
import {
  getString,
  validateSignIn,
  validateSignUp,
  type AuthFormState,
} from "@/lib/auth/validation";
import type { AuthResponse } from "@supabase/supabase-js";

export type { AuthFormState };

function isNonFatalSignUpError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("redirect") ||
    lower.includes("confirmation") ||
    lower.includes("confirm") ||
    (lower.includes("email") && lower.includes("send")) ||
    lower.includes("authapierror")
  );
}

function resolveSignUpResult(
  authData: AuthResponse["data"],
  signUpError: AuthResponse["error"],
): AuthFormState | "continue" {
  if (authData.user?.identities?.length === 0) {
    return { error: "Nalog sa ovim emailom već postoji." };
  }

  if (!authData.user) {
    if (!signUpError || isNonFatalSignUpError(signUpError.message)) {
      return {
        success:
          "Ako je email validan, poslaćemo vam link za potvrdu. Provjerite inbox i spam, zatim se prijavite.",
      };
    }
    return { error: mapAuthError(signUpError.message) };
  }

  if (signUpError && !isNonFatalSignUpError(signUpError.message)) {
    return { error: mapAuthError(signUpError.message) };
  }

  return "continue";
}

export async function signInClient(formData: FormData): Promise<AuthFormState> {
  const email = getString(formData, "email");
  const lozinka = getString(formData, "lozinka");

  const validationError = validateSignIn(email, lozinka);
  if (validationError) return validationError;

  const supabase = createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password: lozinka,
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  const user = signInData.user;
  if (user) {
    const { data: existingProfile } = await supabase
      .from("korisnik")
      .select("id")
      .eq("user_uuid", user.id)
      .maybeSingle();

    if (!existingProfile) {
      const { error: profileError } = await ensureKorisnikProfileForUser(
        supabase,
        user,
      );
      if (profileError) {
        await supabase.auth.signOut();
        return { error: profileError };
      }
    }
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

  const origin = getSiteOrigin(
    typeof window !== "undefined" ? window.location.origin : undefined,
  );

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

  const signUpResult = resolveSignUpResult(authData, signUpError);
  if (signUpResult !== "continue") {
    return signUpResult;
  }

  const user = authData.user;
  if (!user) {
    return {
      success:
        "Nalog je kreiran. Proverite email i potvrdite adresu, zatim se prijavite.",
    };
  }

  if (authData.session) {
    const { error: profileError } = await createKorisnikProfileIfMissing(
      supabase,
      user.id,
      {
        ime,
        prezime,
        korisnicko_ime: korisnickoIme,
        drzava: drzavaRaw,
      },
    );

    if (profileError) {
      return { error: profileError };
    }

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
