import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isUslugaActive } from "@/lib/usluge/utils";

export type SitemapUsluga = {
  id: number;
  lastModified: string;
};

export type SitemapKategorija = {
  slug: string;
};

export type SitemapProfil = {
  id: number;
  lastModified: string;
};

export type SitemapData = {
  usluge: SitemapUsluga[];
  kategorije: SitemapKategorija[];
  profili: SitemapProfil[];
};

async function getReadClient(): Promise<SupabaseClient<Database>> {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

export async function fetchSitemapData(): Promise<SitemapData> {
  const supabase = await getReadClient();

  const [uslugeRes, kategorijeRes] = await Promise.all([
    supabase
      .from("usluge")
      .select("id, korisnik_id, status, expires_at, updated_at, created_at")
      .eq("status", "aktivno")
      .limit(5000),
    supabase.from("kategorije").select("slug").not("slug", "is", null),
  ]);

  const uslugeRows = (uslugeRes.data ?? []).filter((u) =>
    isUslugaActive(u as { status: string; expires_at: string | null }),
  ) as {
    id: number;
    korisnik_id: number;
    updated_at: string | null;
    created_at: string | null;
  }[];

  const usluge: SitemapUsluga[] = uslugeRows.map((u) => ({
    id: u.id,
    lastModified: u.updated_at ?? u.created_at ?? new Date().toISOString(),
  }));

  const kategorije: SitemapKategorija[] = ((kategorijeRes.data ?? []) as {
    slug: string | null;
  }[])
    .filter((k): k is { slug: string } => Boolean(k.slug))
    .map((k) => ({ slug: k.slug }));

  const profilLastMod = new Map<number, string>();
  for (const u of uslugeRows) {
    const ts = u.updated_at ?? u.created_at ?? new Date().toISOString();
    const postojeci = profilLastMod.get(u.korisnik_id);
    if (!postojeci || ts > postojeci) profilLastMod.set(u.korisnik_id, ts);
  }
  const profili: SitemapProfil[] = [...profilLastMod.entries()].map(
    ([id, lastModified]) => ({ id, lastModified }),
  );

  return { usluge, kategorije, profili };
}
