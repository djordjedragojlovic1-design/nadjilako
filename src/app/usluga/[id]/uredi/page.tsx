import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageCard, PageHeader, PageShell } from "@/components/layout/PageShell";
import { UslugaForm } from "@/components/usluge/ObjaviUsluguForm/ObjaviUsluguForm";
import { PromocijaPanel } from "@/components/usluge/PromocijaPanel/PromocijaPanel";
import { getViewerKorisnik } from "@/lib/korisnik/queries";
import { parseMjestaRada } from "@/lib/lokacije/utils";
import { fetchKategorijeZaFormu, fetchUslugaById } from "@/lib/usluge/queries";

type UrediUsluguPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Uredi uslugu",
  robots: { index: false, follow: false },
};

export default async function UrediUsluguPage({ params }: UrediUsluguPageProps) {
  const { id } = await params;
  const uslugaId = Number(id);

  if (Number.isNaN(uslugaId)) {
    notFound();
  }

  const korisnik = await getViewerKorisnik();
  if (!korisnik) {
    redirect(`/prijava?next=/usluga/${uslugaId}/uredi`);
  }

  let usluga: Awaited<ReturnType<typeof fetchUslugaById>> = null;
  let kategorije: Awaited<ReturnType<typeof fetchKategorijeZaFormu>> = [];
  let error: string | null = null;

  try {
    [usluga, kategorije] = await Promise.all([
      fetchUslugaById(uslugaId),
      fetchKategorijeZaFormu(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Greška";
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

  if (usluga.korisnik_id !== korisnik.id) {
    redirect(`/usluga/${uslugaId}`);
  }

  const mjesta = parseMjestaRada(usluga.mjesta_rada);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Oglas"
        title="Uredi uslugu"
        subtitle="Ažurirajte podatke, mjesta rada, cijenu i slike."
      />
      <PageCard wide>
        <UslugaForm
          mode="edit"
          korisnikId={korisnik.id}
          userUuid={korisnik.user_uuid}
          kategorije={kategorije}
          uslugaId={uslugaId}
          initial={{
            naziv: usluga.naziv,
            informacije: usluga.informacije ?? "",
            status: usluga.status,
            cijena: usluga.cijena,
            tip_cijene: usluga.tip_cijene ?? "",
            valuta: usluga.valuta,
            kategorija_id: usluga.kategorija_id,
            drzave: mjesta.drzave,
            gradovi: mjesta.gradovi,
            postojeceSlike: usluga.slikeRows,
          }}
        />
      </PageCard>

      <div className="mx-auto mt-6 max-w-2xl">
        <PromocijaPanel
          uslugaId={usluga.id}
          promocija={usluga.promocija}
          promovisanoDo={usluga.promovisano_do ?? null}
          promovisanoOd={usluga.promovisano_od ?? null}
        />
      </div>
    </PageShell>
  );
}
