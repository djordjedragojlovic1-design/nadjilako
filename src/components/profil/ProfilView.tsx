import Image from "next/image";
import { AppLink } from "@/components/ui/AppLink";
import { PosaljiPorukuButton } from "@/components/chat/PosaljiPorukuButton";
import { StarRating } from "@/components/usluge/StarRating/StarRating";
import { UslugaCard } from "@/components/usluge/UslugaCard/UslugaCard";
import { formatDatum } from "@/lib/usluge/utils";
import type { KorisnikReviewStats, UslugaListItem } from "@/lib/usluge/types";
import type { KorisnikProfil } from "@/lib/korisnik/queries";
import styles from "./ProfilView.module.css";

type ProfilViewProps = {
  korisnik: KorisnikProfil;
  usluge: UslugaListItem[];
  isOwner: boolean;
  viewerId: number | null;
  reviewStats: KorisnikReviewStats;
};

function getInitials(ime: string, prezime: string) {
  return `${ime.charAt(0)}${prezime.charAt(0)}`.toUpperCase();
}

export function ProfilView({
  korisnik,
  usluge,
  isOwner,
  viewerId,
  reviewStats,
}: ProfilViewProps) {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.avatar}>
          {korisnik.profilna_slika ? (
            <Image
              src={korisnik.profilna_slika}
              alt=""
              fill
              className={styles.avatarImg}
              sizes="96px"
            />
          ) : (
            getInitials(korisnik.ime, korisnik.prezime)
          )}
        </div>

        <div className={styles.info}>
          <div className={styles.nameRow}>
            <h1 className={styles.name}>
              {korisnik.ime} {korisnik.prezime}
            </h1>
          </div>
          <p className={styles.username}>@{korisnik.korisnicko_ime}</p>

          {reviewStats.brojRecenzija > 0 && (
            <div className={styles.rating}>
              <StarRating
                rating={reviewStats.prosecnaOcjena}
                reviewCount={reviewStats.brojRecenzija}
              />
            </div>
          )}

          <div className={styles.badges}>
            <span className={`${styles.badge} ${styles.badgeCountry}`}>
              {korisnik.drzava}
            </span>
            {korisnik.is_verified && (
              <span className={`${styles.badge} ${styles.badgeVerified}`}>
                Verifikovan
              </span>
            )}
            {isOwner && (
              <span className={`${styles.badge} ${styles.badgeCredits}`}>
                {korisnik.krediti} kredita
              </span>
            )}
          </div>

          {korisnik.inf_o_korisniku && (
            <p className={styles.about}>{korisnik.inf_o_korisniku}</p>
          )}

          <p className={styles.meta}>
            Član od {formatDatum(korisnik.created_at)} · {usluge.length}{" "}
            {usluge.length === 1 ? "usluga" : "usluga"}
          </p>

          {isOwner ? (
            <div className={styles.actions}>
              <AppLink href="/uredi-profil" className={styles.btnGhost}>
                Uredi profil
              </AppLink>
              <AppLink href="/objavi-uslugu" className={styles.btnPrimary}>
                Objavi uslugu
              </AppLink>
            </div>
          ) : (
            <div className={styles.actions}>
              <PosaljiPorukuButton
                viewerId={viewerId}
                primalacId={korisnik.id}
              />
            </div>
          )}
        </div>
      </header>

      <section className={styles.services} aria-labelledby="usluge-korisnika">
        <h2 id="usluge-korisnika" className={styles.servicesTitle}>
          {isOwner ? "Moje usluge" : "Objavljene usluge"}
        </h2>
        {usluge.length === 0 ? (
          <p className={styles.empty}>
            {isOwner
              ? "Još niste objavili nijednu uslugu. Kliknite „Objavi uslugu”."
              : "Korisnik još nema objavljenih usluga."}
          </p>
        ) : (
          <div className={styles.grid}>
            {usluge.map((usluga) => (
              <UslugaCard key={usluga.id} usluga={usluga} isOwner={isOwner} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
