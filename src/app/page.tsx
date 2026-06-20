import {
  PageCard,
  PageHeader,
  PageShell,
} from "@/components/layout/PageShell";
import { HomeStatusBanner } from "@/components/home/HomeStatusBanner";
import { IzdvojenoSection } from "@/components/usluge/IzdvojenoSection/IzdvojenoSection";
import { fetchIzdvojeneUsluge } from "@/lib/usluge/queries";

type HomePageProps = {
  searchParams: Promise<{ uspjeh?: string; obrisano?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { uspjeh, obrisano } = await searchParams;

  let usluge: Awaited<ReturnType<typeof fetchIzdvojeneUsluge>> = [];
  let error: string | null = null;

  try {
    usluge = await fetchIzdvojeneUsluge();
  } catch (e) {
    error = e instanceof Error ? e.message : "Greška pri učitavanju usluga.";
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Početna"
        title="Pronađi uslugu brzo i lako"
        subtitle="NadjiLako povezuje pružaoce usluga i klijente širom regiona — BiH, Srbija, Hrvatska i Crna Gora."
      />

      <HomeStatusBanner uspjeh={uspjeh} obrisano={obrisano} />

      {error ? (
        <PageCard>
          <p className="text-muted-foreground">
            Nije moguće učitati usluge: {error}
          </p>
        </PageCard>
      ) : (
        <IzdvojenoSection usluge={usluge} />
      )}
    </PageShell>
  );
}
