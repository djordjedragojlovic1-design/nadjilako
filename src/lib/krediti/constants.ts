import type { Promocija } from "@/lib/usluge/constants";

export type PromoTip = "izdvojeno" | "izdvojeno+";

export type KreditPaket = {
  krediti: number;
  cijenaKM: number;
  popularno?: boolean;
};

export const KREDIT_PAKETI: KreditPaket[] = [
  { krediti: 100, cijenaKM: 10 },
  { krediti: 250, cijenaKM: 22, popularno: true },
  { krediti: 500, cijenaKM: 40 },
  { krediti: 1000, cijenaKM: 70 },
];

export const PROMO_CIJENE: Record<PromoTip, number> = {
  izdvojeno: 10,
  "izdvojeno+": 25,
};

export const PROMO_UPGRADE_RAZLIKA =
  PROMO_CIJENE["izdvojeno+"] - PROMO_CIJENE.izdvojeno;

export const PROMO_UPGRADE_RANIH_DANA = 5;

export const PROMO_TRAJANJE_DANA = 30;

export const PROMO_LABELS: Record<PromoTip, string> = {
  izdvojeno: "Izdvojeno",
  "izdvojeno+": "Izdvojeno+",
};

export const PROMO_OPIS: Record<PromoTip, string> = {
  izdvojeno:
    'Vaša usluga se prikazuje u sekciji „Izdvojeno" i rangira iznad običnih oglasa.',
  "izdvojeno+":
    'Najviši nivo isticanja — prioritet u sekciji „Izdvojeno" i u rezultatima pretrage.',
};

export const KREDIT_TIP_LABELS: Record<string, string> = {
  kupovina: "Kupovina",
  promocija: "Promocija",
  povrat: "Povrat",
  admin: "Admin",
};

export const PROMO_TIPOVI: PromoTip[] = ["izdvojeno", "izdvojeno+"];

export function isPromoTip(value: string | null | undefined): value is PromoTip {
  return value === "izdvojeno" || value === "izdvojeno+";
}

export type { Promocija };
