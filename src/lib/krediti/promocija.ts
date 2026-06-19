import {
  PROMO_CIJENE,
  PROMO_LABELS,
  PROMO_TRAJANJE_DANA,
  PROMO_UPGRADE_RANIH_DANA,
  PROMO_UPGRADE_RAZLIKA,
  type PromoTip,
} from "./constants";

export type PromoAkcijaTip = "nova" | "upgrade" | "blokirano";

/** Rana = razlika (15), puna = cijela cijena izdvojeno+ (25). */
export type UpgradeVarijanta = "rana" | "puna";

export type PromoPonuda = {
  akcija: PromoAkcijaTip;
  ciljaniTip: PromoTip;
  ukupno: number;
  upgradeVarijanta?: UpgradeVarijanta;
  trajanjeDana: number;
  razlogBlokade?: string;
};

const MS_PO_DANU = 24 * 60 * 60 * 1000;

/** Aktivna promocija (još nije istekla). */
export function getAktivnaPromocija(
  promocija: string | null | undefined,
  promovisanoDo: string | null | undefined,
): PromoTip | null {
  if (promovisanoDo == null || new Date(promovisanoDo) <= new Date()) {
    return null;
  }
  if (promocija === "izdvojeno" || promocija === "izdvojeno+") {
    return promocija;
  }
  return null;
}

/** Da li je još u prozoru za ranu nadogradnju (prvih 5 dana od promovisano_od). */
export function uRokuZaRanuNadogradnju(
  promovisanoOd: string | null | undefined,
): boolean {
  if (!promovisanoOd) return false;
  const pocetak = new Date(promovisanoOd).getTime();
  return Date.now() - pocetak < PROMO_UPGRADE_RANIH_DANA * MS_PO_DANU;
}

/** Preostali dani u prozoru ranog upgrade-a (0 ako je prošao). */
export function preostaloDanaZaRanUpgrade(
  promovisanoOd: string | null | undefined,
): number {
  if (!promovisanoOd) return 0;
  const pocetak = new Date(promovisanoOd).getTime();
  const preostaloMs =
    PROMO_UPGRADE_RANIH_DANA * MS_PO_DANU - (Date.now() - pocetak);
  if (preostaloMs <= 0) return 0;
  return Math.ceil(preostaloMs / MS_PO_DANU);
}

/** Određuje tip akcije i cijenu za promociju / nadogradnju. */
export function getPromoPonuda(
  aktivna: PromoTip | null,
  ciljaniTip: PromoTip,
  promovisanoOd: string | null | undefined,
  promovisanoDo: string | null | undefined,
): PromoPonuda {
  if (!aktivna) {
    return {
      akcija: "nova",
      ciljaniTip,
      ukupno: PROMO_CIJENE[ciljaniTip],
      trajanjeDana: PROMO_TRAJANJE_DANA,
    };
  }

  if (aktivna === "izdvojeno" && ciljaniTip === "izdvojeno+") {
    const rana = uRokuZaRanuNadogradnju(promovisanoOd);
    return {
      akcija: "upgrade",
      ciljaniTip,
      ukupno: rana ? PROMO_UPGRADE_RAZLIKA : PROMO_CIJENE["izdvojeno+"],
      upgradeVarijanta: rana ? "rana" : "puna",
      trajanjeDana: rana ? 0 : PROMO_TRAJANJE_DANA,
    };
  }

  if (aktivna === ciljaniTip) {
    return {
      akcija: "blokirano",
      ciljaniTip,
      ukupno: 0,
      trajanjeDana: 0,
      razlogBlokade: "Promocija je još aktivna.",
    };
  }

  return {
    akcija: "blokirano",
    ciljaniTip,
    ukupno: 0,
    trajanjeDana: 0,
    razlogBlokade: `Aktivna je promocija „${PROMO_LABELS[aktivna]}".`,
  };
}

/** Datum isteka nakon akcije (prikaz u dijalogu). */
export function izracunajNovoPromovisanoDo(
  ponuda: PromoPonuda,
  promovisanoDo: string | null,
): Date {
  if (
    ponuda.akcija === "upgrade" &&
    ponuda.upgradeVarijanta === "rana" &&
    promovisanoDo
  ) {
    return new Date(promovisanoDo);
  }
  const baza = new Date();
  baza.setDate(baza.getDate() + PROMO_TRAJANJE_DANA);
  return baza;
}

export function mozePromovisati(ponuda: PromoPonuda): boolean {
  return ponuda.akcija === "nova" || ponuda.akcija === "upgrade";
}

export function promoDugmeLabel(ponuda: PromoPonuda): string {
  if (ponuda.akcija === "upgrade") {
    return ponuda.upgradeVarijanta === "rana"
      ? `Nadogradi (${PROMO_UPGRADE_RAZLIKA} kredita)`
      : `Nadogradi (${PROMO_CIJENE["izdvojeno+"]} kredita)`;
  }
  return `Promoviši (${PROMO_TRAJANJE_DANA} dana)`;
}

export function upgradeHint(
  promovisanoOd: string | null | undefined,
): string {
  if (uRokuZaRanuNadogradnju(promovisanoOd)) {
    const preostalo = preostaloDanaZaRanUpgrade(promovisanoOd);
    return `Nadogradnja na Izdvojeno+ košta ${PROMO_UPGRADE_RAZLIKA} kredita (razlika) — još ${preostalo} ${preostalo === 1 ? "dan" : "dana"} u ovom prozoru. Nakon toga puna cijena (${PROMO_CIJENE["izdvojeno+"]} kredita).`;
  }
  return `Nadogradnja na Izdvojeno+ sada košta punu cijenu (${PROMO_CIJENE["izdvojeno+"]} kredita) i traje ${PROMO_TRAJANJE_DANA} dana od danas.`;
}
