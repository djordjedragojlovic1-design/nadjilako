import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/seo/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/chat",
          "/prijava",
          "/registracija",
          "/verifikacija",
          "/uredi-profil",
          "/objavi-uslugu",
          "/sacuvane-objave",
          "/pratioci",
          "/krediti",
          "/obrisi-nalog",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
