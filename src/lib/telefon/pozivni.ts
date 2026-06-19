export const POZIVNI_BROJEVI = [
  { drzava: "Bosna i Hercegovina", kod: "+387", primjer: "066 123 456" },
  { drzava: "Srbija", kod: "+381", primjer: "064 123 456" },
  { drzava: "Hrvatska", kod: "+385", primjer: "091 123 456" },
  { drzava: "Crna Gora", kod: "+382", primjer: "067 123 456" },
] as const;

export type PozivniBroj = (typeof POZIVNI_BROJEVI)[number];

export const PODRAZUMIJEVANI_POZIVNI = POZIVNI_BROJEVI[0].kod;

/**
 * Spaja pozivni broj države i lokalni dio koji je korisnik unio
 * (npr. "066 123-456") u međunarodni format "+38766123456".
 * Vodeća nula lokalnog broja se uklanja.
 */
export function sastaviBrojTelefona(kod: string, lokalni: string): string {
  const cifre = lokalni.replace(/\D/g, "").replace(/^0+/, "");
  if (!cifre) return "";
  return `${kod}${cifre}`;
}

/**
 * Razdvaja sačuvani međunarodni broj (npr. "+38766123456") na
 * pozivni broj države i lokalni dio za prikaz u formi.
 */
export function razdvojBrojTelefona(puniBroj: string | null): {
  kod: string;
  lokalni: string;
} {
  if (!puniBroj) {
    return { kod: PODRAZUMIJEVANI_POZIVNI, lokalni: "" };
  }
  const match = POZIVNI_BROJEVI.find((p) => puniBroj.startsWith(p.kod));
  if (match) {
    return { kod: match.kod, lokalni: puniBroj.slice(match.kod.length) };
  }
  return { kod: PODRAZUMIJEVANI_POZIVNI, lokalni: puniBroj.replace(/^\+/, "") };
}

const E164 = /^\+[1-9]\d{7,14}$/;

export function isValidBrojTelefona(puniBroj: string): boolean {
  return E164.test(puniBroj);
}
