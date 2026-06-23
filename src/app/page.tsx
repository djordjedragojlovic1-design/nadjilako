import {
  PageCard,
  PageHeader,
  PageShell,
} from "@/components/layout/PageShell";
import { HomeStatusBanner } from "@/components/home/HomeStatusBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { IzdvojenoSection } from "@/components/usluge/IzdvojenoSection/IzdvojenoSection";
import {
  absoluteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/config";
import { fetchIzdvojeneUsluge } from "@/lib/usluge/queries";

type HomePageProps = {
  searchParams: Promise<{ uspjeh?: string; obrisano?: string }>;
};

const homeJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "sr",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/pretraga")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: absoluteUrl("/icon"),
  },
];

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
      <JsonLd data={homeJsonLd} />
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
