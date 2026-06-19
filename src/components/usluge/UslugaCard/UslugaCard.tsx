import Image from "next/image";
import { AppLink } from "@/components/ui/AppLink";
import { StarRating } from "@/components/usluge/StarRating/StarRating";
import { TIP_CIJENE_LABELS, VALUTA_LABELS } from "@/lib/usluge/constants";
import { formatCijena, formatDatum } from "@/lib/usluge/utils";
import type { UslugaListItem } from "@/lib/usluge/types";
import styles from "./UslugaCard.module.css";

const CIJENA_LABELS = { ...VALUTA_LABELS, ...TIP_CIJENE_LABELS };

type UslugaCardProps = {
  usluga: UslugaListItem;
  isOwner?: boolean;
};

export function UslugaCard({ usluga, isOwner = false }: UslugaCardProps) {
  const promoClass =
    usluga.promocija === "izdvojeno+"
      ? styles.cardPromoPlus
      : usluga.promocija === "izdvojeno"
        ? styles.cardPromo
        : "";

  const badge =
    usluga.promocija === "izdvojeno+" ? (
      <span className={`${styles.badge} ${styles.badgePlus}`}>Izdvojeno+</span>
    ) : usluga.promocija === "izdvojeno" ? (
      <span className={`${styles.badge} ${styles.badgeStandard}`}>Izdvojeno</span>
    ) : null;

  return (
    <article className={`${styles.card} ${promoClass}`}>
      <AppLink href={`/usluga/${usluga.id}`} className={styles.imageLink}>
        <div className={styles.imageWrap}>
          {badge}
          <Image
            src={usluga.slikaUrl ?? "/placeholder-usluga.svg"}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={styles.image}
            unoptimized={(usluga.slikaUrl ?? "").startsWith("http")}
          />
        </div>
      </AppLink>
      <div className={styles.body}>
        <div className={styles.headerRow}>
          <AppLink href={`/usluga/${usluga.id}`} className={styles.headerText}>
            <h3 className={styles.title}>{usluga.naziv}</h3>
            {usluga.informacije && (
              <p className={styles.excerpt}>{usluga.informacije}</p>
            )}
          </AppLink>
          {isOwner && (
            <AppLink href={`/usluga/${usluga.id}/uredi`} className={styles.editBtn}>
              Uredi
            </AppLink>
          )}
        </div>
        <div className={styles.meta}>
          <div className={styles.ratingRow}>
            <StarRating
              rating={usluga.prosecnaOcjena}
              reviewCount={usluga.brojRecenzija}
            />
          </div>
          <div className={styles.priceRow}>
            <p className={styles.date}>Objavljeno {formatDatum(usluga.created_at)}</p>
            <p className={styles.price}>
              {formatCijena(usluga.cijena, usluga.tip_cijene, usluga.valuta, CIJENA_LABELS)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
