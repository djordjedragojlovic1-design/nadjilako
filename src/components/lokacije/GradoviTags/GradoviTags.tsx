"use client";

import { useState } from "react";
import styles from "./GradoviTags.module.css";

const MAX_VISIBLE = 8;

type GradoviTagsProps = {
  gradovi: string[];
};

export function GradoviTags({ gradovi }: GradoviTagsProps) {
  const [expanded, setExpanded] = useState(false);

  if (gradovi.length === 0) return null;

  const hasMore = gradovi.length > MAX_VISIBLE;
  const visible = expanded || !hasMore ? gradovi : gradovi.slice(0, MAX_VISIBLE);
  const hiddenCount = gradovi.length - MAX_VISIBLE;

  return (
    <div className={styles.gradoviTags}>
      {visible.map((grad) => (
        <span key={grad} className={styles.tag}>
          {grad}
        </span>
      ))}
      {hasMore && !expanded && (
        <button
          type="button"
          className={styles.expandBtn}
          onClick={() => setExpanded(true)}
          aria-label={`Prikaži još ${hiddenCount} gradova`}
        >
          i još {hiddenCount}
        </button>
      )}
      {hasMore && expanded && (
        <button
          type="button"
          className={styles.expandBtn}
          onClick={() => setExpanded(false)}
        >
          Prikaži manje
        </button>
      )}
    </div>
  );
}
