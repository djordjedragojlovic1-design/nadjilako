import type { Metadata } from "next";
import { getSiteOrigin } from "@/lib/auth/site-url";

export const SITE_NAME = "NadjiLako";

export const SITE_URL = getSiteOrigin("https://nadjilako.vercel.app");

export const SITE_TITLE = "NadjiLako — Pronađi uslugu brzo i lako";

export const SITE_DESCRIPTION =
  "NadjiLako je platforma za pronalaženje i objavljivanje usluga u regionu — Bosna i Hercegovina, Srbija, Hrvatska i Crna Gora. Pronađi majstore, profesionalce i pružaoce usluga brzo i lako.";

export const SITE_LOCALE = "sr_RS";

export const SITE_KEYWORDS = [
  "usluge",
  "majstori",
  "pružaoci usluga",
  "oglasi za usluge",
  "NadjiLako",
  "Bosna i Hercegovina",
  "Srbija",
  "Hrvatska",
  "Crna Gora",
  "pronađi majstora",
  "objavi uslugu",
];

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const NOINDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
};
