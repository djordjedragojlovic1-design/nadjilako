import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageCard, PageShell } from "@/components/layout/PageShell";
import { UslugaDetailView } from "@/components/usluge/UslugaDetail/UslugaDetailView";
import { getViewerKorisnikId } from "@/lib/korisnik/queries";
import { absoluteUrl, SITE_NAME } from "@/lib/seo/config";
import { fetchRecenzijeZaUslugu, fetchUslugaById } from "@/lib/usluge/queries";
import type { UslugaDetail } from "@/lib/usluge/types";
import { truncateText } from "@/lib/usluge/utils";
import { fetchDaLiSacuvano } from "@/lib/sacuvane-objave/queries";

type UslugaPageProps = {
  params: Promise<{ id: string }>;
};

function uslugaOpis(usluga: UslugaDetail): string {
  const opis = truncateText(usluga.informacije, 160);
  if (opis) return opis;
  const lokacije = [...usluga.mjesta.gradovi, ...usluga.mjesta.drzave];
  const lokacijaTekst = lokacije.length ? ` · ${lokacije.slice(0, 3).join(", ")}` : "";
  return `${usluga.naziv} — usluga na ${SITE_NAME} platformi${lokacijaTekst}.`;
}

export async function generateMetadata({
  params,
}: UslugaPageProps): Promise<Metadata> {
  const { id } = await params;
  const uslugaId = Number(id);
  if (Number.isNaN(uslugaId)) return { title: "Usluga" };

  try {
    const usluga = await fetchUslugaById(uslugaId);
    if (!usluga) {
      return { title: "Usluga nije pronađena", robots: { index: false } };
    }

    const opis = uslugaOpis(usluga);
    const canonical = `/usluga/${usluga.id}`;
    const slika = usluga.slike[0];

    return {
      title: usluga.naziv,
      description: opis,
      alternates: { canonical },
      openGraph: {
        type: "article",
        title: usluga.naziv,
        description: opis,
        url: canonical,
        images: slika ? [{ url: slika, alt: usluga.naziv }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: usluga.naziv,
        description: opis,
        images: slika ? [slika] : undefined,
      },
    };
  } catch {
    return { title: "Usluga" };
  }
}

function uslugaJsonLd(usluga: UslugaDetail) {
  const url = absoluteUrl(`/usluga/${usluga.id}`);
  const opis = uslugaOpis(usluga);
  const podrucja = [...usluga.mjesta.drzave, ...usluga.mjesta.gradovi];

  const service: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: usluga.naziv,
    description: opis,
    url,
    ...(usluga.slike.length ? { image: usluga.slike } : {}),
    ...(podrucja.length ? { areaServed: podrucja } : {}),
  };

  if (usluga.pruzalac) {
    service.provider = {
      "@type": "Person",
      name: `${usluga.pruzalac.ime} ${usluga.pruzalac.prezime}`.trim(),
      url: absoluteUrl(`/profil/${usluga.pruzalac.id}`),
    };
  }

  if (usluga.cijena != null && usluga.tip_cijene !== "dogovor") {
    service.offers = {
      "@type": "Offer",
      price: usluga.cijena,
      priceCurrency: usluga.valuta ?? "BAM",
      availability: "https://schema.org/InStock",
      url,
    };
  }

  if (usluga.brojRecenzija > 0 && usluga.prosecnaOcjena > 0) {
    service.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: usluga.prosecnaOcjena,
      reviewCount: usluga.brojRecenzija,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Početna",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Pretraga",
        item: absoluteUrl("/pretraga"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: usluga.naziv,
        item: url,
      },
    ],
  };

  return [service, breadcrumb];
}

export default async function UslugaPage({ params }: UslugaPageProps) {
  const { id } = await params;
  const uslugaId = Number(id);

  if (Number.isNaN(uslugaId)) {
    notFound();
  }

  let usluga: Awaited<ReturnType<typeof fetchUslugaById>> = null;
  let recenzije: Awaited<ReturnType<typeof fetchRecenzijeZaUslugu>> = [];
  let viewerKorisnikId: number | null = null;
  let viewerSaved = false;
  let error: string | null = null;

  try {
    [usluga, viewerKorisnikId] = await Promise.all([
      fetchUslugaById(uslugaId),
      getViewerKorisnikId(),
    ]);
    if (usluga) {
      recenzije = await fetchRecenzijeZaUslugu(uslugaId);
      if (viewerKorisnikId != null && viewerKorisnikId !== usluga.korisnik_id) {
        viewerSaved = await fetchDaLiSacuvano(viewerKorisnikId, uslugaId);
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Greška pri učitavanju.";
  }

  if (error) {
    return (
      <PageShell>
        <PageCard>
          <p className="text-muted-foreground">
            Nije moguće učitati uslugu: {error}
          </p>
        </PageCard>
      </PageShell>
    );
  }

  if (!usluga) {
    notFound();
  }

  return (
    <PageShell>
      <JsonLd data={uslugaJsonLd(usluga)} />
      <UslugaDetailView
        usluga={usluga}
        recenzije={recenzije}
        isOwner={viewerKorisnikId === usluga.korisnik_id}
        viewerId={viewerKorisnikId}
        viewerSaved={viewerSaved}
      />
    </PageShell>
  );
}
