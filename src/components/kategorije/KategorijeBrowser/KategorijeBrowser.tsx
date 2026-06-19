"use client";

import { useMemo, useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import type { KategorijaCvor } from "@/lib/usluge/types";
import styles from "./KategorijeBrowser.module.css";

type KategorijeBrowserProps = {
  stablo: KategorijaCvor[];
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function brojLabela(broj: number): string {
  return broj === 1 ? "1 usluga" : `${broj} usluga`;
}

export function KategorijeBrowser({ stablo }: KategorijeBrowserProps) {
  const [upit, setUpit] = useState("");

  const filtrirano = useMemo(() => {
    const q = normalize(upit.trim());
    if (!q) return stablo;

    return stablo
      .map((parent) => {
        const parentMatch = normalize(parent.naziv).includes(q);
        if (parentMatch) return parent;

        const djeca = parent.djeca.filter((dijete) =>
          normalize(dijete.naziv).includes(q),
        );
        if (djeca.length) return { ...parent, djeca };

        return null;
      })
      .filter((parent): parent is KategorijaCvor => parent !== null);
  }, [upit, stablo]);

  return (
    <div className={styles.wrap}>
      <div className={styles.searchWrap}>
        <svg
          className={styles.searchIcon}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path
            d="M20 20l-3-3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Pretraži kategorije..."
          aria-label="Pretraži kategorije"
          value={upit}
          onChange={(e) => setUpit(e.target.value)}
        />
      </div>

      {filtrirano.length === 0 ? (
        <p className={styles.empty}>
          Nema kategorija koje odgovaraju pojmu „{upit.trim()}".
        </p>
      ) : (
        <div className={styles.grid}>
          {filtrirano.map((parent) => (
            <section key={parent.id} className={styles.box}>
              <AppLink
                href={`/pretraga?kategorija=${parent.slug}`}
                className={styles.parentLink}
              >
                <span className={styles.parentNaziv}>{parent.naziv}</span>
                <span className={styles.broj}>{brojLabela(parent.ukupnoUsluga)}</span>
              </AppLink>

              {parent.djeca.length > 0 && (
                <ul className={styles.djeca}>
                  {parent.djeca.map((dijete) => (
                    <li key={dijete.id}>
                      <AppLink
                        href={`/pretraga?kategorija=${dijete.slug}`}
                        className={styles.childLink}
                      >
                        <span className={styles.childNaziv}>{dijete.naziv}</span>
                        <span className={styles.brojMuted}>{dijete.brojUsluga}</span>
                      </AppLink>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
