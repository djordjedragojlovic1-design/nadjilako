"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KategorijaFacet } from "@/lib/usluge/types";
import styles from "./KategorijaSelect.module.css";

type KategorijaSelectProps = {
  kategorije: KategorijaFacet[];
  value: string | null;
  onChange: (slug: string | null) => void;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function KategorijaSelect({
  kategorije,
  value,
  onChange,
}: KategorijaSelectProps) {
  const [open, setOpen] = useState(false);
  const [pretraga, setPretraga] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const izabrana = value
    ? kategorije.find((k) => k.slug === value)?.naziv ?? "Kategorija"
    : null;

  const filtrirane = useMemo(() => {
    const q = normalize(pretraga.trim());
    if (!q) return kategorije;
    return kategorije.filter((k) => normalize(k.naziv).includes(q));
  }, [pretraga, kategorije]);

  const izaberi = (slug: string | null) => {
    onChange(slug);
    setOpen(false);
    setPretraga("");
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={izabrana ? styles.triggerValue : styles.triggerPlaceholder}>
          {izabrana ?? "Sve kategorije"}
        </span>
        <svg className={styles.caret} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className={styles.panel}>
          <input
            type="search"
            className={styles.search}
            placeholder="Pretraži kategorije..."
            value={pretraga}
            onChange={(e) => setPretraga(e.target.value)}
            autoFocus
          />
          <ul className={styles.list} role="listbox">
            <li>
              <button
                type="button"
                className={`${styles.option} ${value === null ? styles.optionActive : ""}`}
                onClick={() => izaberi(null)}
              >
                Sve kategorije
              </button>
            </li>
            {filtrirane.map((k) => (
              <li key={k.slug}>
                <button
                  type="button"
                  className={`${styles.option} ${
                    k.parentNaziv ? styles.optionChild : styles.optionParent
                  } ${k.slug === value ? styles.optionActive : ""}`}
                  onClick={() => izaberi(k.slug)}
                >
                  <span className={styles.optionNaziv}>{k.naziv}</span>
                  <span className={styles.optionCount}>{k.count}</span>
                </button>
              </li>
            ))}
            {filtrirane.length === 0 && (
              <li className={styles.prazno}>Nema rezultata</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
