"use client";

import { useState } from "react";
import { UslugaCard } from "@/components/usluge/UslugaCard/UslugaCard";
import {
  IZDVJENO_INITIAL,
  IZDVJENO_MAX,
  IZDVJENO_STEP,
} from "@/lib/usluge/constants";
import type { UslugaListItem } from "@/lib/usluge/types";
import styles from "./IzdvojenoSection.module.css";

type IzdvojenoSectionProps = {
  usluge: UslugaListItem[];
};

export function IzdvojenoSection({ usluge }: IzdvojenoSectionProps) {
  const [visible, setVisible] = useState(IZDVJENO_INITIAL);

  const shown = usluge.slice(0, visible);
  const canShowMore = visible < usluge.length && visible < IZDVJENO_MAX;
  const remaining = Math.min(IZDVJENO_STEP, usluge.length - visible, IZDVJENO_MAX - visible);

  return (
    <section className={styles.section} aria-labelledby="izdvojeno-heading">
      <header className={styles.header}>
        <h2 id="izdvojeno-heading" className={styles.title}>
          Izdvojeno
        </h2>
        <p className={styles.subtitle}>
          Prvo promovisane usluge (Izdvojeno+ i Izdvojeno), zatim najbolje ocijenjene.
        </p>
      </header>

      {usluge.length === 0 ? (
        <p className={styles.empty}>Trenutno nema aktivnih usluga za prikaz.</p>
      ) : (
        <>
          <div className={styles.grid}>
            {shown.map((usluga) => (
              <UslugaCard key={usluga.id} usluga={usluga} />
            ))}
          </div>

          {canShowMore && (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.moreBtn}
                onClick={() =>
                  setVisible((v) => Math.min(v + IZDVJENO_STEP, IZDVJENO_MAX, usluge.length))
                }
              >
                Prikaži još ({remaining})
              </button>
              <p className={styles.hint}>
                Prikazano {shown.length} od {Math.min(usluge.length, IZDVJENO_MAX)} usluga
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
