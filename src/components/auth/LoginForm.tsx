"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { signInClient } from "@/lib/auth/client-actions";
import authStyles from "./auth.module.css";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const result = await signInClient(formData);

    if (result.error) {
      setError(result.error);
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
          placeholder="vas@email.com"
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
          autoComplete="current-password"
          required
          minLength={6}
          className={authStyles.input}
          placeholder="••••••••"
        />
      </div>

      <button type="submit" className={authStyles.submit} disabled={pending}>
        {pending ? "Prijava..." : "Prijavi se"}
      </button>

      <p className={authStyles.footer}>
        Nemate nalog? <AppLink href="/registracija">Registrujte se</AppLink>
      </p>
    </form>
  );
}
