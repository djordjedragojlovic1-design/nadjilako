"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { kupiKrediteClient } from "@/lib/krediti/client";
import {
  KREDIT_PAKETI,
  KREDIT_TIP_LABELS,
  PROMO_CIJENE,
} from "@/lib/krediti/constants";
import type { KreditTransakcija } from "@/types/database";
import styles from "./KreditiView.module.css";

type KreditiViewProps = {
  stanje: number;
  transakcije: KreditTransakcija[];
};

function formatDatum(iso: string): string {
  return new Intl.DateTimeFormat("sr-Latn-BA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function KreditiView({ stanje, transakcije }: KreditiViewProps) {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [kupujem, setKupujem] = useState<number | null>(null);
  const [poruka, setPoruka] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);

  async function kupi(iznos: number) {
    setKupujem(iznos);
    setPoruka(null);
    setGreska(null);

    const { error, saldo } = await kupiKrediteClient(iznos);

    if (error) {
      setGreska(error);
      setKupujem(null);
      return;
    }

    await refreshProfile();
    router.refresh();
    setPoruka(
      `Uspješno ste dodali ${iznos} kredita. Novo stanje: ${saldo ?? stanje + iznos} kredita.`,
    );
    setKupujem(null);
  }

  return (
    <div className={styles.wrap}>
      <section className={styles.balanceCard}>
        <span className={styles.balanceLabel}>Trenutno stanje</span>
        <span className={styles.balanceValue}>
          {stanje}
          <span className={styles.balanceUnit}>kredita</span>
        </span>
        <p className={styles.balanceHint}>
          Promocija „Izdvojeno&quot; košta {PROMO_CIJENE.izdvojeno} kredita, a
          „Izdvojeno+&quot; {PROMO_CIJENE["izdvojeno+"]} kredita (po 30 dana).
        </p>
      </section>

      {greska && (
        <p className={`${styles.alert} ${styles.alertError}`} role="alert">
          {greska}
        </p>
      )}
      {poruka && (
        <p className={`${styles.alert} ${styles.alertSuccess}`} role="status">
          {poruka}
        </p>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Dopuni kredite</h2>
        <p className={styles.sectionSub}>
          Plaćanje je trenutno simulirano — krediti se dodaju odmah.
        </p>
        <div className={styles.paketi}>
          {KREDIT_PAKETI.map((paket) => (
            <div
              key={paket.krediti}
              className={`${styles.paket} ${paket.popularno ? styles.paketPopularno : ""}`}
            >
              {paket.popularno && (
                <span className={styles.paketBadge}>Najpopularnije</span>
              )}
              <span className={styles.paketKrediti}>{paket.krediti}</span>
              <span className={styles.paketKreditiLabel}>kredita</span>
              <span className={styles.paketCijena}>{paket.cijenaKM} KM</span>
              <button
                type="button"
                className={styles.kupiBtn}
                onClick={() => kupi(paket.krediti)}
                disabled={kupujem !== null}
              >
                {kupujem === paket.krediti ? "Obrada..." : "Kupi"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Istorija transakcija</h2>
        {transakcije.length === 0 ? (
          <p className={styles.empty}>Još nemate transakcija.</p>
        ) : (
          <ul className={styles.lista}>
            {transakcije.map((t) => (
              <li key={t.id} className={styles.stavka}>
                <div className={styles.stavkaInfo}>
                  <span className={styles.stavkaOpis}>
                    {t.opis ?? KREDIT_TIP_LABELS[t.tip] ?? t.tip}
                  </span>
                  <span className={styles.stavkaDatum}>
                    {formatDatum(t.created_at)}
                  </span>
                </div>
                <div className={styles.stavkaIznosi}>
                  <span
                    className={`${styles.stavkaIznos} ${
                      t.iznos >= 0 ? styles.iznosPlus : styles.iznosMinus
                    }`}
                  >
                    {t.iznos >= 0 ? `+${t.iznos}` : t.iznos}
                  </span>
                  <span className={styles.stavkaSaldo}>
                    stanje: {t.saldo_poslije}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
