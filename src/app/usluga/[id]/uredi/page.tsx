import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { UslugaForm } from "@/components/usluge/ObjaviUsluguForm/ObjaviUsluguForm";
import { PromocijaPanel } from "@/components/usluge/PromocijaPanel/PromocijaPanel";
import { getViewerKorisnik } from "@/lib/korisnik/queries";
import { parseMjestaRada } from "@/lib/lokacije/utils";
import { fetchKategorijeZaFormu, fetchUslugaById } from "@/lib/usluge/queries";
import styles from "@/styles/page.module.css";

type UrediUsluguPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Uredi uslugu",
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

  if (usluga.korisnik_id !== korisnik.id) {
    redirect(`/usluga/${uslugaId}`);
  }

  const mjesta = parseMjestaRada(usluga.mjesta_rada);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Oglas</span>
        <h1 className={styles.title}>Uredi uslugu</h1>
        <p className={styles.subtitle}>
          Ažurirajte podatke, mjesta rada, cijenu i slike.
        </p>
      </header>
      <section className={`${styles.card} ${styles.cardWide}`}>
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
            cijena: usluga.cijena ?? 0,
            tip_cijene: usluga.tip_cijene ?? "",
            valuta: usluga.valuta ?? "BAM",
            kategorija_id: usluga.kategorija_id,
            drzave: mjesta.drzave,
            gradovi: mjesta.gradovi,
            postojeceSlike: usluga.slikeRows,
          }}
        />
      </section>

      <div style={{ maxWidth: "40rem", marginTop: "var(--space-lg)" }}>
        <PromocijaPanel
          uslugaId={usluga.id}
          promocija={usluga.promocija}
          promovisanoDo={usluga.promovisano_do ?? null}
          promovisanoOd={usluga.promovisano_od ?? null}
        />
      </div>
    </div>
  );
}
