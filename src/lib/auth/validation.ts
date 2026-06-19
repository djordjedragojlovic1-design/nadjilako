import { DRZAVE, type Drzava } from "@/types/database";

export type AuthFormState = {
  error?: string;
  success?: string;
};

export function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function isDrzava(value: string): value is Drzava {
  return (DRZAVE as readonly string[]).includes(value);
}

export function validateSignIn(email: string, lozinka: string): AuthFormState | null {
  if (!email || !lozinka) {
    return { error: "Unesite email i lozinku." };
  }
  return null;
}

export function validateSignUp(fields: {
  ime: string;
  prezime: string;
  korisnickoIme: string;
  email: string;
  lozinka: string;
  drzavaRaw: string;
}): AuthFormState | null {
  const { ime, prezime, korisnickoIme, email, lozinka, drzavaRaw } = fields;

  if (!ime || !prezime || !korisnickoIme || !email || !lozinka || !drzavaRaw) {
    return { error: "Popunite sva obavezna polja." };
  }

  if (!isDrzava(drzavaRaw)) {
    return { error: "Izaberite validnu državu." };
  }

  if (lozinka.length < 6) {
    return { error: "Lozinka mora imati najmanje 6 karaktera." };
  }

  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(korisnickoIme)) {
    return {
      error:
        "Korisničko ime mora imati 3–30 karaktera (slova, brojevi, _, ., -).",
    };
  }

  return null;
}
