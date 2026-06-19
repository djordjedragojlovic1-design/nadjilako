"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { signUpClient } from "@/lib/auth/client-actions";
import { DRZAVE } from "@/types/database";
import authStyles from "./auth.module.css";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const result = await signUpClient(formData);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    if (result.success) {
      setSuccess(result.success);
      setPending(false);
      return;
    }

    router.refresh();
    router.push("/");
  }

  return (
    <form className={authStyles.form} onSubmit={handleSubmit}>
      {error && (
        <p className={`${authStyles.alert} ${authStyles.alertError}`} role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className={`${authStyles.alert} ${authStyles.alertSuccess}`} role="status">
          {success}
        </p>
      )}

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="ime">
          Ime
        </label>
        <input
          id="ime"
          name="ime"
          type="text"
          autoComplete="given-name"
          required
          className={authStyles.input}
        />
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="prezime">
          Prezime
        </label>
        <input
          id="prezime"
          name="prezime"
          type="text"
          autoComplete="family-name"
          required
          className={authStyles.input}
        />
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="korisnicko_ime">
          Korisničko ime
        </label>
        <input
          id="korisnicko_ime"
          name="korisnicko_ime"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_.-]+"
          className={authStyles.input}
          placeholder="npr. marko123"
        />
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={authStyles.input}
        />
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="lozinka">
          Lozinka
        </label>
        <input
          id="lozinka"
          name="lozinka"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className={authStyles.input}
        />
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="drzava">
          Država
        </label>
        <select id="drzava" name="drzava" required className={authStyles.select} defaultValue="">
          <option value="" disabled>
            Izaberite državu
          </option>
          {DRZAVE.map((drzava) => (
            <option key={drzava} value={drzava}>
              {drzava}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className={authStyles.submit} disabled={pending}>
        {pending ? "Registracija..." : "Registruj se"}
      </button>

      <p className={authStyles.footer}>
        Već imate nalog? <AppLink href="/prijava">Prijavite se</AppLink>
      </p>
    </form>
  );
}
