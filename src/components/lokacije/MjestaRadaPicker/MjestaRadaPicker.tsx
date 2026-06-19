"use client";

import { useMemo, useState } from "react";
import {
  DRZAVE,
  GRADOVI_PO_DRZAVI,
  gradoviZaDrzave,
  gradoviZaDrzavu,
} from "@/lib/lokacije/gradovi";
import type { Drzava } from "@/types/database";
import styles from "./MjestaRadaPicker.module.css";

const MAX_VISIBLE = 8;

type MjestaRadaPickerProps = {
  drzave: Drzava[];
  gradovi: string[];
  onDrzaveChange: (drzave: Drzava[]) => void;
  onGradoviChange: (gradovi: string[]) => void;
};

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase("sr");
}

function filterGradovi(cityList: string[], query: string): string[] {
  const q = normalizeSearch(query);
  if (!q) return cityList;
  return cityList.filter((g) => g.toLocaleLowerCase("sr").includes(q));
}

function getVisibleGradovi(
  cityList: string[],
  selected: string[],
  expanded: boolean,
  query: string,
): string[] {
  const filtered = filterGradovi(cityList, query);
  if (query.trim() || expanded) return filtered;

  const selectedInCountry = selected.filter((g) => cityList.includes(g));
  const unselected = cityList.filter((g) => !selectedInCountry.includes(g));
  const combined = [...selectedInCountry, ...unselected];
  return combined.slice(0, MAX_VISIBLE);
}

type CityGroupProps = {
  drzava: Drzava;
  gradovi: string[];
  onGradoviChange: (gradovi: string[]) => void;
};

function CityGroup({ drzava, gradovi, onGradoviChange }: CityGroupProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);

  const cityList = useMemo(() => gradoviZaDrzavu(drzava), [drzava]);
  const selectedCount = cityList.filter((g) => gradovi.includes(g)).length;
  const allSelected = selectedCount === cityList.length;

  const filteredCount = filterGradovi(cityList, search).length;
  const visibleGradovi = getVisibleGradovi(cityList, gradovi, expanded, search);
  const hasMore =
    !search.trim() && !expanded && cityList.length > MAX_VISIBLE;

  const toggleGrad = (grad: string) => {
    if (gradovi.includes(grad)) {
      onGradoviChange(gradovi.filter((g) => g !== grad));
    } else {
      onGradoviChange([...gradovi, grad]);
    }
  };

  const toggleSviGradovi = () => {
    const allSelectedNow = cityList.every((g) => gradovi.includes(g));
    if (allSelectedNow) {
      const set = new Set<string>(cityList);
      onGradoviChange(gradovi.filter((g) => !set.has(g)));
    } else {
      onGradoviChange([...new Set([...gradovi, ...cityList])]);
    }
  };

  return (
    <div className={styles.cityGroup}>
      <div className={styles.cityGroupHeader}>
        <p className={styles.cityGroupTitle}>
          {drzava}{" "}
          <span className={styles.count}>
            ({selectedCount}/{cityList.length})
          </span>
        </p>
        <button
          type="button"
          className={styles.selectAllBtn}
          onClick={toggleSviGradovi}
        >
          {allSelected ? "Poništi sve" : "Svi gradovi"}
        </button>
      </div>

      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          className={styles.searchInput}
          placeholder={`Pretraži gradove — ${drzava}`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setExpanded(false);
          }}
          aria-label={`Pretraga gradova u ${drzava}`}
        />
      </div>

      {search.trim() && filteredCount === 0 ? (
        <p className={styles.noResults}>Nema rezultata za „{search.trim()}”.</p>
      ) : (
        <div className={styles.checkboxGrid}>
          {visibleGradovi.map((grad) => (
            <label
              key={grad}
              className={`${styles.checkLabel} ${gradovi.includes(grad) ? styles.checkLabelActive : ""}`}
            >
              <input
                type="checkbox"
                className={styles.checkInput}
                checked={gradovi.includes(grad)}
                onChange={() => toggleGrad(grad)}
              />
              {grad}
            </label>
          ))}
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          className={styles.showMoreBtn}
          onClick={() => setExpanded(true)}
        >
          Prikaži sve ({cityList.length})
        </button>
      )}

      {!search.trim() && expanded && cityList.length > MAX_VISIBLE && (
        <button
          type="button"
          className={styles.showMoreBtn}
          onClick={() => setExpanded(false)}
        >
          Prikaži manje
        </button>
      )}
    </div>
  );
}

export function MjestaRadaPicker({
  drzave,
  gradovi,
  onDrzaveChange,
  onGradoviChange,
}: MjestaRadaPickerProps) {
  const toggleDrzava = (drzava: Drzava) => {
    if (drzave.includes(drzava)) {
      const nextDrzave = drzave.filter((d) => d !== drzava);
      const allowed = new Set(gradoviZaDrzave(nextDrzave));
      onDrzaveChange(nextDrzave);
      onGradoviChange(gradovi.filter((g) => allowed.has(g)));
    } else {
      onDrzaveChange([...drzave, drzava]);
    }
  };

  return (
    <div className={styles.wrap}>
      <div>
        <p className={styles.groupTitle}>Države rada</p>
        <p className={styles.hint}>Možete izabrati jednu ili više država.</p>
        <div className={styles.checkboxGrid}>
          {DRZAVE.map((drzava) => (
            <label
              key={drzava}
              className={`${styles.checkLabel} ${drzave.includes(drzava) ? styles.checkLabelActive : ""}`}
            >
              <input
                type="checkbox"
                className={styles.checkInput}
                checked={drzave.includes(drzava)}
                onChange={() => toggleDrzava(drzava)}
              />
              {drzava}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className={styles.groupTitle}>Gradovi</p>
        <p className={styles.hint}>
          Prikazano je do {MAX_VISIBLE} gradova po državi. Koristite pretragu ili
          „Prikaži sve” za ostale.
        </p>
        {drzave.length === 0 ? (
          <p className={styles.empty}>Prvo izaberite državu.</p>
        ) : (
          <div className={styles.cityGroups}>
            {drzave.map((drzava) => (
              <CityGroup
                key={drzava}
                drzava={drzava}
                gradovi={gradovi}
                onGradoviChange={onGradoviChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
