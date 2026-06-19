"use client";

import { useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { mapAuthError } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";
import authStyles from "@/components/auth/auth.module.css";
import styles from "./VerifikacijaPanel.module.css";

type VerifikacijaPanelProps = {
  korisnikId: number;
  email: string;
  emailVerifikovan: boolean;
  brojTelefona: string | null;
  telefonVerifikovan: boolean;
};

function StatusBadge({ verifikovan }: { verifikovan: boolean }) {
  return (
    <span
      className={`${styles.badge} ${
        verifikovan ? styles.badgeOk : styles.badgePending
      }`}
    >
      {verifikovan ? "Verifikovano" : "Nije verifikovano"}
    </span>
  );
}

export function VerifikacijaPanel({
  email,
  emailVerifikovan,
  brojTelefona,
  telefonVerifikovan,
}: VerifikacijaPanelProps) {
  // Email
  const [emailPending, setEmailPending] = useState(false);
  const [emailPoruka, setEmailPoruka] = useState<string | null>(null);
  const [emailGreska, setEmailGreska] = useState<string | null>(null);

  async function posaljiEmailPonovo() {
    setEmailPending(true);
    setEmailPoruka(null);
    setEmailGreska(null);

    const supabase = createClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });

    if (error) {
      setEmailGreska(mapAuthError(error.message));
    } else {
      setEmailPoruka(
        "Poslali smo verifikacioni link na vašu email adresu. Provjerite inbox i spam.",
      );
    }
    setEmailPending(false);
  }

  return (
    <div className={styles.wrap}>
      {/* ─── Email ─── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}>Email adresa</h2>
            <p className={styles.sectionValue}>{email || "—"}</p>
          </div>
          <StatusBadge verifikovan={emailVerifikovan} />
        </div>

        {emailGreska && (
          <p
            className={`${authStyles.alert} ${authStyles.alertError}`}
            role="alert"
          >
            {emailGreska}
          </p>
        )}
        {emailPoruka && (
          <p
            className={`${authStyles.alert} ${authStyles.alertSuccess}`}
            role="status"
          >
            {emailPoruka}
          </p>
        )}

        {emailVerifikovan ? (
          <p className={styles.hint}>Vaša email adresa je potvrđena.</p>
        ) : (
          <button
            type="button"
            className={styles.actionBtn}
            onClick={posaljiEmailPonovo}
            disabled={emailPending}
          >
            {emailPending ? "Slanje..." : "Pošalji verifikacioni email"}
          </button>
        )}
      </div>

      <hr className={styles.divider} />

      {/* ─── Telefon ─── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}>Broj telefona</h2>
            <p className={styles.sectionValue}>{brojTelefona || "—"}</p>
          </div>
          {brojTelefona && telefonVerifikovan && (
            <StatusBadge verifikovan />
          )}
        </div>

        {!brojTelefona ? (
          <p className={styles.hint}>
            Niste unijeli broj telefona. Dodajte ga na stranici{" "}
            <AppLink href="/uredi-profil" className={styles.link}>
              Uredi profil
            </AppLink>
            .
          </p>
        ) : telefonVerifikovan ? (
          <p className={styles.hint}>Vaš broj telefona je potvrđen.</p>
        ) : (
          <p className={styles.hint}>
            Verifikacija broja telefona trenutno nije moguća u ovoj fazi.
            Uvešćemo je naknadno.
          </p>
        )}
      </div>

      <p className={authStyles.footer}>
        <AppLink href="/uredi-profil">Nazad na uređivanje profila</AppLink>
      </p>
    </div>
  );
}
