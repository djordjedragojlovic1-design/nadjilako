"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { formatKratkoVrijeme, getInitials } from "@/lib/chat/format";
import type { RazgovorListItem } from "@/lib/chat/types";
import styles from "./Chat.module.css";

type RazgovorListaProps = {
  razgovori: RazgovorListItem[];
  activeChatId: number | null;
};

function preview(r: RazgovorListItem): string {
  if (!r.poslednjaPoruka) return "Nema poruka";
  const prefix = r.poslednjaPoruka.odMene ? "Vi: " : "";
  if (r.poslednjaPoruka.tekst) return `${prefix}${r.poslednjaPoruka.tekst}`;
  if (r.poslednjaPoruka.imaSliku) return `${prefix}📷 Slika`;
  return "Nema poruka";
}

export function RazgovorLista({ razgovori, activeChatId }: RazgovorListaProps) {
  const [q, setQ] = useState("");

  const filtrirani = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return razgovori;
    return razgovori.filter((r) => {
      const ime = `${r.drugiUcesnik.ime} ${r.drugiUcesnik.prezime}`.toLowerCase();
      const username = r.drugiUcesnik.korisnicko_ime.toLowerCase();
      const usluga = r.usluga?.naziv.toLowerCase() ?? "";
      return (
        ime.includes(term) || username.includes(term) || usluga.includes(term)
      );
    });
  }, [q, razgovori]);

  return (
    <>
      <div className={styles.listHeader}>
        <h1 className={styles.listTitle}>Poruke</h1>
        <input
          type="search"
          className={styles.search}
          placeholder="Pretraži razgovore..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Pretraga razgovora"
        />
      </div>

      <div className={styles.listScroll}>
        {filtrirani.length === 0 ? (
          <p className={styles.empty}>
            {razgovori.length === 0
              ? "Još nemate nijedan razgovor."
              : "Nema rezultata pretrage."}
          </p>
        ) : (
          filtrirani.map((r) => {
            const ucesnik = r.drugiUcesnik;
            const prikaznoIme = `@${ucesnik.korisnicko_ime}`;
            const nepr = r.brojNeprocitanih > 0;
            return (
              <AppLink
                key={r.id}
                href={`/chat/${r.id}`}
                className={`${styles.razgovor} ${
                  r.id === activeChatId ? styles.razgovorActive : ""
                }`}
              >
                <span className={styles.avatar}>
                  {ucesnik.profilna_slika ? (
                    <Image
                      src={ucesnik.profilna_slika}
                      alt=""
                      fill
                      sizes="44px"
                      className={styles.avatarImg}
                    />
                  ) : (
                    getInitials(ucesnik.ime, ucesnik.prezime)
                  )}
                </span>
                <span className={styles.razgovorBody}>
                  <span className={styles.razgovorTop}>
                    <span className={styles.razgovorName}>{prikaznoIme}</span>
                    <span className={styles.razgovorTime}>
                      {formatKratkoVrijeme(r.lastMessageAt)}
                    </span>
                  </span>
                  <span className={styles.razgovorPreview}>
                    <span
                      className={`${styles.razgovorText} ${
                        nepr ? styles.razgovorTextUnread : ""
                      }`}
                    >
                      {preview(r)}
                    </span>
                    {nepr && (
                      <span className={styles.badge}>{r.brojNeprocitanih}</span>
                    )}
                  </span>
                  {r.usluga && (
                    <span className={styles.razgovorUsluga}>
                      {r.usluga.naziv}
                    </span>
                  )}
                </span>
              </AppLink>
            );
          })
        )}
      </div>
    </>
  );
}
