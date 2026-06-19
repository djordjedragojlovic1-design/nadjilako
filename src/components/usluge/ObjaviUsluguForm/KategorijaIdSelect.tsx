"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./KategorijaIdSelect.module.css";

export type KategorijaStavka = {
  id: number;
  naziv: string;
  parentNaziv?: string | null;
};

type KategorijaIdSelectProps = {
  kategorije: KategorijaStavka[];
  value: number | null;
  onChange: (id: number | null) => void;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function KategorijaIdSelect({
  kategorije,
  value,
  onChange,
}: KategorijaIdSelectProps) {
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

  const izabrana =
    value != null ? kategorije.find((k) => k.id === value)?.naziv ?? null : null;

  const filtrirane = useMemo(() => {
    const q = normalize(pretraga.trim());
    if (!q) return kategorije;
    return kategorije.filter((k) => normalize(k.naziv).includes(q));
  }, [pretraga, kategorije]);

  const izaberi = (id: number | null) => {
    onChange(id);
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
          {izabrana ?? "Bez kategorije"}
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
                Bez kategorije
              </button>
            </li>
            {filtrirane.map((k) => (
              <li key={k.id}>
                <button
                  type="button"
                  className={`${styles.option} ${
                    k.parentNaziv ? styles.optionChild : styles.optionParent
                  } ${k.id === value ? styles.optionActive : ""}`}
                  onClick={() => izaberi(k.id)}
                >
                  {k.naziv}
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
