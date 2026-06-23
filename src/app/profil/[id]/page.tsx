import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageCard, PageShell } from "@/components/layout/PageShell";
import { ProfilView } from "@/components/profil/ProfilView";
import {
  fetchKorisnikById,
  getViewerKorisnikId,
  type KorisnikProfil,
  resolveProfilId,
} from "@/lib/korisnik/queries";
import { absoluteUrl, SITE_NAME } from "@/lib/seo/config";
import {
  fetchKorisnikReviewStats,
  fetchUslugeByKorisnikId,
} from "@/lib/usluge/queries";
import { truncateText } from "@/lib/usluge/utils";
import { fetchBrojPratilaca, fetchDaLiPrati } from "@/lib/pratioci/queries";

type ProfilPageProps = {
  params: Promise<{ id: string }>;
};

function profilOpis(korisnik: KorisnikProfil): string {
  const opis = truncateText(korisnik.inf_o_korisniku, 160);
  if (opis) return opis;
  const lokacija = korisnik.lokacija ? `${korisnik.lokacija}, ` : "";
  return `Profil korisnika ${korisnik.ime} ${korisnik.prezime} na ${SITE_NAME} — ${lokacija}${korisnik.drzava}. Pogledaj usluge i recenzije.`;
}

function profilSlika(korisnik: KorisnikProfil): string | undefined {
  const slika = korisnik.profilna_slika;
  return slika && /^https?:\/\//.test(slika) ? slika : undefined;
}

export async function generateMetadata({
  params,
}: ProfilPageProps): Promise<Metadata> {
  const { id } = await params;
  const profilId = await resolveProfilId(id);
  if (!profilId) return { title: "Profil", robots: { index: false } };

  try {
    const korisnik = await fetchKorisnikById(profilId);
    if (!korisnik) {
      return { title: "Profil nije pronađen", robots: { index: false } };
    }

    const ime = `${korisnik.ime} ${korisnik.prezime}`.trim();
    const opis = profilOpis(korisnik);
    const canonical = `/profil/${korisnik.id}`;
    const slika = profilSlika(korisnik);

    return {
      title: ime,
      description: opis,
      alternates: { canonical },
      openGraph: {
        type: "profile",
        title: ime,
        description: opis,
        url: canonical,
        images: slika ? [{ url: slika, alt: ime }] : undefined,
      },
      twitter: {
        card: slika ? "summary_large_image" : "summary",
        title: ime,
        description: opis,
        images: slika ? [slika] : undefined,
      },
    };
  } catch {
    return { title: "Profil" };
  }
}

function profilJsonLd(
  korisnik: KorisnikProfil,
  reviewStats: { prosecnaOcjena: number; brojRecenzija: number },
) {
  const ime = `${korisnik.ime} ${korisnik.prezime}`.trim();
  const url = absoluteUrl(`/profil/${korisnik.id}`);
  const slika = profilSlika(korisnik);

  const person: Record<string, unknown> = {
    "@type": "Person",
    name: ime,
    url,
    ...(korisnik.inf_o_korisniku
      ? { description: truncateText(korisnik.inf_o_korisniku, 250) }
      : {}),
    ...(slika ? { image: slika } : {}),
    ...(korisnik.lokacija || korisnik.drzava
      ? {
          address: {
            "@type": "PostalAddress",
            ...(korisnik.lokacija ? { addressLocality: korisnik.lokacija } : {}),
            addressCountry: korisnik.drzava,
          },
        }
      : {}),
  };

  if (reviewStats.brojRecenzija > 0 && reviewStats.prosecnaOcjena > 0) {
    person.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewStats.prosecnaOcjena,
      reviewCount: reviewStats.brojRecenzija,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: person,
  };
}

export default async function ProfilPage({ params }: ProfilPageProps) {
  const { id } = await params;
  const profilId = await resolveProfilId(id);

  if (!profilId) {
    notFound();
  }

  let korisnik: Awaited<ReturnType<typeof fetchKorisnikById>> = null;
  let usluge: Awaited<ReturnType<typeof fetchUslugeByKorisnikId>> = [];
  let viewerId: number | null = null;
  let reviewStats: Awaited<ReturnType<typeof fetchKorisnikReviewStats>> = {
    prosecnaOcjena: 0,
    brojRecenzija: 0,
  };
  let brojPratilaca = 0;
  let viewerPrati = false;
  let error: string | null = null;

  try {
    [korisnik, usluge, viewerId, reviewStats, brojPratilaca] =
      await Promise.all([
        fetchKorisnikById(profilId),
        fetchUslugeByKorisnikId(profilId),
        getViewerKorisnikId(),
        fetchKorisnikReviewStats(profilId),
        fetchBrojPratilaca(profilId),
      ]);

    if (viewerId != null && viewerId !== profilId) {
      viewerPrati = await fetchDaLiPrati(viewerId, profilId);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Greška pri učitavanju profila.";
  }

  if (error) {
    return (
      <PageShell>
        <PageCard>
          <p className="text-muted-foreground">
            Nije moguće učitati profil: {error}
          </p>
        </PageCard>
      </PageShell>
    );
  }

  if (!korisnik) {
    notFound();
  }

  const isOwner = viewerId === korisnik.id;

  return (
    <PageShell>
      <JsonLd data={profilJsonLd(korisnik, reviewStats)} />
      <ProfilView
        korisnik={korisnik}
        usluge={usluge}
        isOwner={isOwner}
        viewerId={viewerId}
        reviewStats={reviewStats}
        brojPratilaca={brojPratilaca}
        viewerPrati={viewerPrati}
      />
    </PageShell>
  );
}
