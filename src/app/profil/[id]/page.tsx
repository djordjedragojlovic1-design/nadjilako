import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageCard, PageShell } from "@/components/layout/PageShell";
import { ProfilView } from "@/components/profil/ProfilView";
import {
  fetchKorisnikById,
  getViewerKorisnikId,
  resolveProfilId,
} from "@/lib/korisnik/queries";
import {
  fetchKorisnikReviewStats,
  fetchUslugeByKorisnikId,
} from "@/lib/usluge/queries";
import { fetchBrojPratilaca, fetchDaLiPrati } from "@/lib/pratioci/queries";

type ProfilPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProfilPageProps): Promise<Metadata> {
  const { id } = await params;
  const profilId = await resolveProfilId(id);
  if (!profilId) return { title: "Profil" };

  try {
    const korisnik = await fetchKorisnikById(profilId);
    if (!korisnik) return { title: "Profil nije pronađen" };
    return {
      title: `${korisnik.ime} ${korisnik.prezime}`,
    };
  } catch {
    return { title: "Profil" };
  }
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
