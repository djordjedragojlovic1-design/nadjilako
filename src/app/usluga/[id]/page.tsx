import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageCard, PageShell } from "@/components/layout/PageShell";
import { UslugaDetailView } from "@/components/usluge/UslugaDetail/UslugaDetailView";
import { getViewerKorisnikId } from "@/lib/korisnik/queries";
import { fetchRecenzijeZaUslugu, fetchUslugaById } from "@/lib/usluge/queries";
import { fetchDaLiSacuvano } from "@/lib/sacuvane-objave/queries";

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
