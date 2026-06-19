"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GRADOVI_PO_DRZAVI } from "@/lib/lokacije/gradovi";
import {
  DEFAULT_VALUTA,
  TIP_CIJENE_LABELS,
  VALUTA_LABELS,
  VALUTA_OPTIONS,
} from "@/lib/usluge/constants";
import type {
  PretragaFacets,
  PretragaFilteriValues,
} from "@/lib/usluge/types";
import { KategorijaSelect } from "./KategorijaSelect";
import styles from "./PretragaFilteri.module.css";

type PretragaFilteriProps = {
  filteri: PretragaFilteriValues;
  facets: PretragaFacets;
};

function setOrDelete(
  params: URLSearchParams,
  key: string,
  value: string | number | null | undefined,
) {
  if (value === null || value === undefined || value === "") {
    params.delete(key);
  } else {
    params.set(key, String(value));
  }
}

export function PretragaFilteri({ filteri, facets }: PretragaFilteriProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [drzava, setDrzava] = useState(filteri.drzava ?? "");
  const [grad, setGrad] = useState(filteri.grad ?? "");
  const [kategorija, setKategorija] = useState<string | null>(filteri.kategorija);
  const [tip, setTip] = useState(filteri.tip ?? "");
  const [valuta, setValuta] = useState(filteri.valuta || DEFAULT_VALUTA);
  const [cijenaMin, setCijenaMin] = useState(
    filteri.cijenaMin != null ? String(filteri.cijenaMin) : "",
  );
  const [cijenaMax, setCijenaMax] = useState(
    filteri.cijenaMax != null ? String(filteri.cijenaMax) : "",
  );
  const [ocjena, setOcjena] = useState<number | null>(filteri.ocjena);

  const gradBroj = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of facets.gradovi) m.set(g.value, g.count);
    return m;
  }, [facets.gradovi]);

  const gradoviZaDrzavu = drzava
    ? GRADOVI_PO_DRZAVI[drzava as keyof typeof GRADOVI_PO_DRZAVI] ?? []
    : [];

  const primijeni = () => {
    const params = new URLSearchParams(searchParams.toString());
    setOrDelete(params, "kategorija", kategorija);
    setOrDelete(params, "drzava", drzava);
    setOrDelete(params, "grad", drzava ? grad : null);
    setOrDelete(params, "tip", tip);
    if (tip) {
      setOrDelete(params, "valuta", valuta !== DEFAULT_VALUTA ? valuta : null);
      setOrDelete(params, "cijena_min", cijenaMin);
      setOrDelete(params, "cijena_max", cijenaMax);
    } else {
      params.delete("valuta");
      params.delete("cijena_min");
      params.delete("cijena_max");
    }
    setOrDelete(params, "ocjena", ocjena);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  };

  const ponisti = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const k of [
      "kategorija",
      "drzava",
      "grad",
      "tip",
      "valuta",
      "cijena_min",
      "cijena_max",
      "ocjena",
      "page",
    ]) {
      params.delete(k);
    }
    setDrzava("");
    setGrad("");
    setKategorija(null);
    setTip("");
    setValuta(DEFAULT_VALUTA);
    setCijenaMin("");
    setCijenaMax("");
    setOcjena(null);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  };

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.mobileToggle}
        onClick={() => setOpen(true)}
      >
        Filteri
      </button>

      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      <div className={`${styles.panel} ${open ? styles.panelOpen : ""}`}>
        <div className={styles.panelHeader}>
          <h2 className={styles.heading}>Filteri</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setOpen(false)}
            aria-label="Zatvori filtere"
          >
            ✕
          </button>
        </div>

        <div className={styles.group}>
          <label className={styles.label} htmlFor="f-drzava">
            Država
          </label>
          <select
            id="f-drzava"
            className={styles.select}
            value={drzava}
            onChange={(e) => {
              setDrzava(e.target.value);
              setGrad("");
            }}
          >
            <option value="">Sve države</option>
            {facets.drzave.map((d) => (
              <option key={d.value} value={d.value}>
                {d.value} ({d.count})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.group}>
          <label className={styles.label} htmlFor="f-grad">
            Grad
          </label>
          <select
            id="f-grad"
            className={styles.select}
            value={grad}
            onChange={(e) => setGrad(e.target.value)}
            disabled={!drzava}
          >
            <option value="">{drzava ? "Svi gradovi" : "Prvo izaberi državu"}</option>
            {gradoviZaDrzavu.map((g) => {
              const broj = gradBroj.get(g);
              return (
                <option key={g} value={g}>
                  {broj != null ? `${g} (${broj})` : g}
                </option>
              );
            })}
          </select>
        </div>

        <div className={styles.group}>
          <span className={styles.label}>Kategorija</span>
          <KategorijaSelect
            kategorije={facets.kategorije}
            value={kategorija}
            onChange={setKategorija}
          />
        </div>

        <div className={styles.group}>
          <label className={styles.label} htmlFor="f-tip">
            Tip cijene
          </label>
          <select
            id="f-tip"
            className={styles.select}
            value={tip}
            onChange={(e) => setTip(e.target.value)}
          >
            <option value="">Svi tipovi</option>
            {facets.tipovi.map((t) => (
              <option key={t.value} value={t.value}>
                {(TIP_CIJENE_LABELS[t.value] ?? t.value)} ({t.count})
              </option>
            ))}
          </select>
        </div>

        {tip && (
          <div className={styles.group}>
            <label className={styles.label} htmlFor="f-valuta">
              Valuta (samo radi lakšeg unosa)
            </label>
            <select
              id="f-valuta"
              className={styles.select}
              value={valuta}
              onChange={(e) => setValuta(e.target.value)}
            >
              {VALUTA_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {VALUTA_LABELS[v] ?? v}
                </option>
              ))}
            </select>

            <span className={styles.label} style={{ marginTop: "0.75rem" }}>
              Raspon cijene
            </span>
            <div className={styles.range}>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className={styles.rangeInput}
                placeholder="Od"
                value={cijenaMin}
                onChange={(e) => setCijenaMin(e.target.value)}
                aria-label="Cijena od"
              />
              <span className={styles.rangeSep}>–</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className={styles.rangeInput}
                placeholder="Do"
                value={cijenaMax}
                onChange={(e) => setCijenaMax(e.target.value)}
                aria-label="Cijena do"
              />
            </div>
            <p className={styles.hint}>
              Prikazuju se i usluge u drugim valutama (preračun u pozadini).
            </p>
          </div>
        )}

        <div className={styles.group}>
          <span className={styles.label}>Minimalna ocjena</span>
          <div className={styles.ocjene}>
            {[...facets.ocjene]
              .sort((a, b) => a.value - b.value)
              .map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`${styles.ocjenaBtn} ${
                    ocjena === o.value ? styles.ocjenaActive : ""
                  }`}
                  onClick={() =>
                    setOcjena(ocjena === o.value ? null : o.value)
                  }
                >
                  {o.value}+ <span className={styles.ocjenaCount}>({o.count})</span>
                </button>
              ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.applyBtn} onClick={primijeni}>
            Primijeni
          </button>
          <button type="button" className={styles.resetBtn} onClick={ponisti}>
            Poništi filtere
          </button>
        </div>
      </div>
    </div>
  );
}
