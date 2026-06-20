import type { Metadata } from "next";
import {
  PageCard,
  PageHeader,
  PageShell,
} from "@/components/layout/PageShell";
import { KategorijeBrowser } from "@/components/kategorije/KategorijeBrowser/KategorijeBrowser";
import { fetchKategorijeStablo } from "@/lib/usluge/queries";
import type { KategorijaCvor } from "@/lib/usluge/types";

export const metadata: Metadata = {
  title: "Kategorije",
};

export default async function KategorijePage() {
  let stablo: KategorijaCvor[] = [];
  let error: string | null = null;

  try {
    stablo = await fetchKategorijeStablo();
  } catch (e) {
    error = e instanceof Error ? e.message : "Greška pri učitavanju kategorija.";
  }

  return (
    <PageShell>
      <PageHeader title="Kategorije usluga" />
      {error ? (
        <PageCard>
          <p className="text-muted-foreground">
            Nije moguće učitati kategorije: {error}
          </p>
        </PageCard>
      ) : (
        <KategorijeBrowser stablo={stablo} />
      )}
    </PageShell>
  );
}
