"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { AppLink } from "@/components/ui/AppLink";
import { PromocijaPotvrdaDialog } from "@/components/usluge/PromocijaPotvrdaDialog/PromocijaPotvrdaDialog";
import { promovisiUsluguClient } from "@/lib/krediti/client";
import {
  PROMO_CIJENE,
  PROMO_LABELS,
  PROMO_OPIS,
  PROMO_TIPOVI,
  type PromoTip,
} from "@/lib/krediti/constants";
import {
  getAktivnaPromocija,
  getPromoPonuda,
  izracunajNovoPromovisanoDo,
  mozePromovisati,
  promoDugmeLabel,
  upgradeHint,
} from "@/lib/krediti/promocija";
import styles from "./PromocijaPanel.module.css";

type PromocijaPanelProps = {
  uslugaId: number;
  promocija: string | null;
  promovisanoDo: string | null;
  promovisanoOd: string | null;
};

function formatDatum(iso: string): string {
  return new Intl.DateTimeFormat("sr-Latn-BA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function PromocijaPanel({
  uslugaId,
  promocija,
  promovisanoDo,
  promovisanoOd,
}: PromocijaPanelProps) {
  const router = useRouter();
  const { korisnik, refreshProfile } = useAuth();
  const krediti = korisnik?.krediti ?? 0;

  const [pending, setPending] = useState(false);
  const [potvrdaTip, setPotvrdaTip] = useState<PromoTip | null>(null);
  const [poruka, setPoruka] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);

  const aktivna = getAktivnaPromocija(promocija, promovisanoDo);

  const potvrdaPonuda = useMemo(
    () =>
      potvrdaTip
        ? getPromoPonuda(aktivna, potvrdaTip, promovisanoOd, promovisanoDo)
        : null,
    [aktivna, potvrdaTip, promovisanoOd, promovisanoDo],
  );

  const potvrdaNovoDo = useMemo(() => {
    if (!potvrdaPonuda) return new Date();
    return izracunajNovoPromovisanoDo(potvrdaPonuda, promovisanoDo);
  }, [potvrdaPonuda, promovisanoDo]);

  function otvoriPotvrdu(tip: PromoTip) {
    const ponuda = getPromoPonuda(aktivna, tip, promovisanoOd, promovisanoDo);
    if (!mozePromovisati(ponuda)) return;
    setPotvrdaTip(tip);
    setGreska(null);
  }

  async function potvrdiPromociju() {
    if (!potvrdaTip || !potvrdaPonuda) return;

    setPending(true);
    setPoruka(null);
    setGreska(null);

    const { error, saldo } = await promovisiUsluguClient(uslugaId, potvrdaTip);

    if (error) {
      setGreska(error);
      setPending(false);
      return;
    }

    await refreshProfile();
    router.refresh();

    const uspjeh =
      potvrdaPonuda.akcija === "upgrade"
        ? `Usluga je nadograđena na ${PROMO_LABELS[potvrdaTip]}. Preostalo stanje: ${saldo ?? krediti} kredita.`
        : `Usluga je promovisana (${PROMO_LABELS[potvrdaTip]}). Preostalo stanje: ${saldo ?? krediti} kredita.`;

    setPoruka(uspjeh);
    setPotvrdaTip(null);
    setPending(false);
  }

  return (
    <>
      <div className={styles.panel}>
        <div className={styles.head}>
          <h2 className={styles.title}>Promocija usluge</h2>
          <span className={styles.saldo}>{krediti} kredita</span>
        </div>

        {aktivna ? (
          <>
            <p className={styles.statusActive}>
              Trenutno aktivno: <strong>{PROMO_LABELS[aktivna]}</strong>
              {promovisanoDo && <> — do {formatDatum(promovisanoDo)}</>}
            </p>
            <p className={styles.statusHint}>
              {aktivna === "izdvojeno"
                ? upgradeHint(promovisanoOd)
                : "Nova promocija moguća je tek nakon isteka trenutne."}
            </p>
          </>
        ) : (
          <p className={styles.statusInactive}>Usluga trenutno nije promovisana.</p>
        )}

        {greska && (
          <p className={`${styles.alert} ${styles.alertError}`} role="alert">
            {greska}
            {greska.toLowerCase().includes("kredita") && (
              <>
                {" "}
                <AppLink href="/krediti" className={styles.link}>
                  Dopuni kredite
                </AppLink>
              </>
            )}
          </p>
        )}
        {poruka && (
          <p className={`${styles.alert} ${styles.alertSuccess}`} role="status">
            {poruka}
          </p>
        )}

        <div className={styles.opcije}>
          {PROMO_TIPOVI.map((tip) => {
            const ponuda = getPromoPonuda(
              aktivna,
              tip,
              promovisanoOd,
              promovisanoDo,
            );
            const dozvoljeno = mozePromovisati(ponuda);
            const cijena = dozvoljeno ? ponuda.ukupno : PROMO_CIJENE[tip];
            const nedovoljno = dozvoljeno && krediti < cijena;

            return (
              <div
                key={tip}
                className={`${styles.opcija} ${!dozvoljeno ? styles.opcijaBlokirana : ""}`}
              >
                <div className={styles.opcijaHead}>
                  <span className={styles.opcijaNaziv}>{PROMO_LABELS[tip]}</span>
                  <span className={styles.opcijaCijena}>
                    {dozvoljeno && ponuda.akcija === "upgrade"
                      ? `${cijena} kredita (nadogradnja)`
                      : `${cijena} kredita`}
                  </span>
                </div>
                <p className={styles.opcijaOpis}>{PROMO_OPIS[tip]}</p>
                <button
                  type="button"
                  className={styles.promoBtn}
                  onClick={() => otvoriPotvrdu(tip)}
                  disabled={pending || !dozvoljeno || nedovoljno}
                >
                  {promoDugmeLabel(ponuda)}
                </button>
                {!dozvoljeno && ponuda.razlogBlokade && (
                  <span className={styles.nedovoljno}>{ponuda.razlogBlokade}</span>
                )}
                {dozvoljeno && nedovoljno && (
                  <span className={styles.nedovoljno}>
                    Nedovoljno kredita —{" "}
                    <AppLink href="/krediti" className={styles.link}>
                      dopuni
                    </AppLink>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {potvrdaPonuda && potvrdaTip && (
        <PromocijaPotvrdaDialog
          open={potvrdaTip !== null}
          ponuda={potvrdaPonuda}
          promovisanoDo={promovisanoDo}
          novoDo={potvrdaNovoDo}
          krediti={krediti}
          pending={pending}
          onClose={() => {
            if (!pending) setPotvrdaTip(null);
          }}
          onConfirm={potvrdiPromociju}
        />
      )}
    </>
  );
}
