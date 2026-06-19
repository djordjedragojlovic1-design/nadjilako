import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import styles from "@/styles/page.module.css";

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
  let error: string | null = null;

  try {
    [korisnik, usluge, viewerId, reviewStats] = await Promise.all([
      fetchKorisnikById(profilId),
      fetchUslugeByKorisnikId(profilId),
      getViewerKorisnikId(),
      fetchKorisnikReviewStats(profilId),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Greška pri učitavanju profila.";
  }

  if (error) {
    return (
      <div className={styles.page}>
        <section className={styles.card}>
          <p>Nije moguće učitati profil: {error}</p>
        </section>
      </div>
    );
  }

  if (!korisnik) {
    notFound();
  }

  const isOwner = viewerId === korisnik.id;

  return (
    <div className={styles.page}>
      <ProfilView
        korisnik={korisnik}
        usluge={usluge}
        isOwner={isOwner}
        viewerId={viewerId}
        reviewStats={reviewStats}
      />
    </div>
  );
}
