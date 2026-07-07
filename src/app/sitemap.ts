import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/config";
import { fetchSitemapData } from "@/lib/seo/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/pretraga"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/kategorije"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  let dynamicEntries: MetadataRoute.Sitemap = [];

  try {
    const { usluge, kategorije, profili } = await fetchSitemapData();

    const uslugeEntries: MetadataRoute.Sitemap = usluge.map((u) => ({
      url: absoluteUrl(`/usluga/${u.id}`),
      lastModified: new Date(u.lastModified),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const kategorijeEntries: MetadataRoute.Sitemap = kategorije.map((k) => ({
      url: absoluteUrl(`/pretraga?kategorija=${encodeURIComponent(k.slug)}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const profiliEntries: MetadataRoute.Sitemap = profili.map((p) => ({
      url: absoluteUrl(`/profil/${p.id}`),
      lastModified: new Date(p.lastModified),
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    dynamicEntries = [
      ...uslugeEntries,
      ...kategorijeEntries,
      ...profiliEntries,
    ];
  } catch {
  }

  return [...staticEntries, ...dynamicEntries];
}
