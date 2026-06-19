"use client";

import {
  PROMO_CIJENE,
  PROMO_LABELS,
  PROMO_TRAJANJE_DANA,
  PROMO_UPGRADE_RAZLIKA,
  type PromoTip,
} from "@/lib/krediti/constants";
import type { PromoPonuda } from "@/lib/krediti/promocija";
import styles from "./PromocijaPotvrdaDialog.module.css";

type PromocijaPotvrdaDialogProps = {
  open: boolean;
  ponuda: PromoPonuda;
  promovisanoDo: string | null;
  novoDo: Date;
  krediti: number;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function formatDatum(d: Date | string): string {
  return new Intl.DateTimeFormat("sr-Latn-BA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(typeof d === "string" ? new Date(d) : d);
}

export function PromocijaPotvrdaDialog({
  open,
  ponuda,
  promovisanoDo,
  novoDo,
  krediti,
  pending,
  onClose,
  onConfirm,
}: PromocijaPotvrdaDialogProps) {
  if (!open) return null;

  const { ciljaniTip, ukupno, akcija, upgradeVarijanta } = ponuda;
  const nedovoljno = krediti < ukupno;
  const naslov =
    akcija === "upgrade" ? "Potvrda nadogradnje" : "Potvrda promocije";

  const ranaUpgrade =
    akcija === "upgrade" && upgradeVarijanta === "rana";

  return (
    <div className={styles.overlay} onClick={pending ? undefined : onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-potvrda-naslov"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="promo-potvrda-naslov" className={styles.title}>
          {naslov}
        </h3>

        <p className={styles.lead}>
          {akcija === "upgrade" ? (
            <>
              Nadograditi sa „{PROMO_LABELS.izdvojeno}&quot; na „
              {PROMO_LABELS[ciljaniTip]}&quot;?
            </>
          ) : (
            <>
              Promovisati uslugu kao „{PROMO_LABELS[ciljaniTip]}&quot; na{" "}
              {PROMO_TRAJANJE_DANA} dana?
            </>
          )}
        </p>

        <dl className={styles.breakdown}>
          {ranaUpgrade && (
            <div className={styles.row}>
              <dt>Naknada razlike</dt>
              <dd>{PROMO_UPGRADE_RAZLIKA} kredita</dd>
            </div>
          )}
          {akcija === "upgrade" && upgradeVarijanta === "puna" && (
            <div className={styles.row}>
              <dt>Puna cijena (Izdvojeno+)</dt>
              <dd>{PROMO_CIJENE["izdvojeno+"]} kredita</dd>
            </div>
          )}
          <div className={`${styles.row} ${styles.rowTotal}`}>
            <dt>Ukupno</dt>
            <dd>{ukupno} kredita</dd>
          </div>
          {akcija === "upgrade" && (
            <div className={styles.row}>
              <dt>{ranaUpgrade ? "Rok (ostaje isti)" : "Novi rok"}</dt>
              <dd>do {formatDatum(ranaUpgrade && promovisanoDo ? promovisanoDo : novoDo)}</dd>
            </div>
          )}
          {akcija === "nova" && (
            <div className={styles.row}>
              <dt>Traje do</dt>
              <dd>{formatDatum(novoDo)}</dd>
            </div>
          )}
          <div className={styles.row}>
            <dt>Vaše stanje</dt>
            <dd>{krediti} kredita</dd>
          </div>
        </dl>

        {nedovoljno && (
          <p className={styles.greska} role="alert">
            Nemate dovoljno kredita za ovu akciju.
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={pending}
          >
            Odustani
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={pending || nedovoljno}
          >
            {pending ? "Obrada..." : `Plati ${ukupno} kredita`}
          </button>
        </div>
      </div>
    </div>
  );
}
