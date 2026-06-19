import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UslugaDetailView } from "@/components/usluge/UslugaDetail/UslugaDetailView";
import { getViewerKorisnikId } from "@/lib/korisnik/queries";
import { fetchRecenzijeZaUslugu, fetchUslugaById } from "@/lib/usluge/queries";
import styles from "@/styles/page.module.css";

type UslugaPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: UslugaPageProps): Promise<Metadata> {
  const { id } = await params;
  const uslugaId = Number(id);
  if (Number.isNaN(uslugaId)) return { title: "Usluga" };

  try {
    const usluga = await fetchUslugaById(uslugaId);
    if (!usluga) return { title: "Usluga nije pronađena" };
    return { title: usluga.naziv };
  } catch {
    return { title: "Usluga" };
  }
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
  let error: string | null = null;

  try {
    [usluga, viewerKorisnikId] = await Promise.all([
      fetchUslugaById(uslugaId),
      getViewerKorisnikId(),
    ]);
    if (usluga) {
      recenzije = await fetchRecenzijeZaUslugu(uslugaId);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Greška pri učitavanju.";
  }

  if (error) {
    return (
      <div className={styles.page}>
        <section className={styles.card}>
          <p>Nije moguće učitati uslugu: {error}</p>
        </section>
      </div>
    );
  }

  if (!usluga) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <UslugaDetailView
        usluga={usluga}
        recenzije={recenzije}
        isOwner={viewerKorisnikId === usluga.korisnik_id}
        viewerId={viewerKorisnikId}
      />
    </div>
  );
}
