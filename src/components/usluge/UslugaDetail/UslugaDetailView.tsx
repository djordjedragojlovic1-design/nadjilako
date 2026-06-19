"use client";

import Image from "next/image";
import { useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { PosaljiPorukuButton } from "@/components/chat/PosaljiPorukuButton";
import { PromocijaPanel } from "@/components/usluge/PromocijaPanel/PromocijaPanel";
import { StarRating } from "@/components/usluge/StarRating/StarRating";
import { RecenzijeSekcija } from "@/components/usluge/RecenzijeSekcija/RecenzijeSekcija";
import {
  STATUS_LABELS,
  TIP_CIJENE_LABELS,
  VALUTA_LABELS,
} from "@/lib/usluge/constants";
import { GradoviTags } from "@/components/lokacije/GradoviTags/GradoviTags";
import type { RecenzijaItem, UslugaDetail } from "@/lib/usluge/types";
import { formatCijena, formatDatum, PLACEHOLDER_IMAGE } from "@/lib/usluge/utils";
import styles from "./UslugaDetail.module.css";

type Tab = "detalji" | "recenzije";

type UslugaDetailViewProps = {
  usluga: UslugaDetail;
  recenzije: RecenzijaItem[];
  isOwner?: boolean;
  viewerId?: number | null;
};

function getInitials(ime: string, prezime: string): string {
  return `${ime.charAt(0)}${prezime.charAt(0)}`.toUpperCase();
}

function isRemoteImage(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function UslugaDetailView({
  usluga,
  recenzije,
  isOwner = false,
  viewerId = null,
}: UslugaDetailViewProps) {
  const [tab, setTab] = useState<Tab>("detalji");
  const slike = usluga.slike.length > 0 ? usluga.slike : [PLACEHOLDER_IMAGE];
  const [activeImage, setActiveImage] = useState(0);
  const mainSrc = slike[activeImage];

  const isActive = usluga.status === "aktivno";
  const statusLabel = STATUS_LABELS[usluga.status] ?? usluga.status;

  return (
    <article className={styles.layout}>
      <div>
        <div className={styles.gallery}>
          <Image
            src={mainSrc}
            alt={usluga.naziv}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
            className={styles.mainImage}
            unoptimized={isRemoteImage(mainSrc)}
          />
        </div>
        {slike.length > 1 && (
          <div className={styles.thumbs}>
            {slike.map((url, i) => (
              <button
                key={url + i}
                type="button"
                className={`${styles.thumb} ${i === activeImage ? styles.thumbActive : ""}`}
                onClick={() => setActiveImage(i)}
                aria-label={`Slika ${i + 1}`}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="72px"
                  className={styles.thumbImg}
                  unoptimized={isRemoteImage(url)}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.content}>
        <header className={styles.header}>
          {usluga.promocija === "izdvojeno+" && (
            <span className={`${styles.promoBadge} ${styles.promoPlus}`}>Izdvojeno+</span>
          )}
          {usluga.promocija === "izdvojeno" && (
            <span className={`${styles.promoBadge} ${styles.promoStd}`}>Izdvojeno</span>
          )}
          <h1 className={styles.title}>{usluga.naziv}</h1>
          <StarRating
            rating={usluga.prosecnaOcjena}
            reviewCount={usluga.brojRecenzija}
          />
          <p className={styles.price}>
            {formatCijena(usluga.cijena, usluga.tip_cijene, usluga.valuta, {
              ...VALUTA_LABELS,
              ...TIP_CIJENE_LABELS,
            })}
          </p>
          <p
            className={`${styles.status} ${isActive ? styles.statusActive : styles.statusInactive}`}
          >
            <span className={styles.statusDot} aria-hidden />
            {statusLabel}
          </p>
          {isOwner && (
            <AppLink href={`/usluga/${usluga.id}/uredi`} className={styles.editBtn}>
              Uredi uslugu
            </AppLink>
          )}
        </header>

        {isOwner && (
          <PromocijaPanel
            uslugaId={usluga.id}
            promocija={usluga.promocija}
            promovisanoDo={usluga.promovisano_do ?? null}
            promovisanoOd={usluga.promovisano_od ?? null}
          />
        )}

        {(usluga.mjesta.drzave.length > 0 || usluga.mjesta.gradovi.length > 0) ? (
          <div className={styles.locations}>
            {usluga.mjesta.drzave.length > 0 && (
              <div>
                <p className={styles.locLabel}>Države</p>
                <div className={styles.tags}>
                  {usluga.mjesta.drzave.map((d) => (
                    <span key={d} className={styles.tag}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {usluga.mjesta.gradovi.length > 0 && (
              <div>
                <p className={styles.locLabel}>Gradovi</p>
                <GradoviTags gradovi={usluga.mjesta.gradovi} />
              </div>
            )}
          </div>
        ) : null}

        {usluga.pruzalac && (
          <div className={styles.provider}>
            <div className={styles.providerAvatar}>
              {usluga.pruzalac.profilna_slika ? (
                <Image
                  src={usluga.pruzalac.profilna_slika}
                  alt=""
                  width={48}
                  height={48}
                  className={styles.providerImg}
                />
              ) : (
                getInitials(usluga.pruzalac.ime, usluga.pruzalac.prezime)
              )}
            </div>
            <div>
              <p className={styles.providerName}>
                {usluga.pruzalac.ime} {usluga.pruzalac.prezime}
              </p>
              <AppLink
                href={`/profil/${usluga.pruzalac.id}`}
                className={styles.providerLink}
              >
                @{usluga.pruzalac.korisnicko_ime}
              </AppLink>
            </div>
            {!isOwner && (
              <PosaljiPorukuButton
                viewerId={viewerId}
                primalacId={usluga.pruzalac.id}
                uslugaId={usluga.id}
                label="Kontaktiraj"
                className={styles.contactBtn}
              />
            )}
          </div>
        )}
      </div>

      <div className={styles.fullWidth}>
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "detalji"}
            className={`${styles.tab} ${tab === "detalji" ? styles.tabActive : ""}`}
            onClick={() => setTab("detalji")}
          >
            Detalji
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "recenzije"}
            className={`${styles.tab} ${tab === "recenzije" ? styles.tabActive : ""}`}
            onClick={() => setTab("recenzije")}
          >
            Recenzije ({usluga.brojRecenzija})
          </button>
        </div>

        <div className={styles.panel} role="tabpanel">
          {tab === "detalji" ? (
            <>
              {usluga.informacije ? (
                <p className={styles.infoText}>{usluga.informacije}</p>
              ) : (
                <p className={styles.infoText}>Nema dodatnih informacija.</p>
              )}
              <div className={styles.metaRow}>
                <span>Objavljeno: {formatDatum(usluga.created_at)}</span>
                {usluga.tip_cijene && (
                  <span>
                    Tip cijene: {TIP_CIJENE_LABELS[usluga.tip_cijene] ?? usluga.tip_cijene}
                  </span>
                )}
                {usluga.valuta && (
                  <span>Valuta: {VALUTA_LABELS[usluga.valuta] ?? usluga.valuta}</span>
                )}
              </div>
            </>
          ) : (
            <RecenzijeSekcija
              uslugaId={usluga.id}
              ocjenjenId={usluga.korisnik_id}
              recenzije={recenzije}
            />
          )}
        </div>
      </div>
    </article>
  );
}
