import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ObjaviUsluguForm } from "@/components/usluge/ObjaviUsluguForm/ObjaviUsluguForm";
import { getViewerKorisnik } from "@/lib/korisnik/queries";
import { fetchKategorijeZaFormu } from "@/lib/usluge/queries";
import styles from "@/styles/page.module.css";

export const metadata: Metadata = {
  title: "Objavi uslugu",
};

export default async function ObjaviUsluguPage() {
  const korisnik = await getViewerKorisnik();

  if (!korisnik) {
    redirect("/prijava?next=/objavi-uslugu");
  }

  let kategorije: Awaited<ReturnType<typeof fetchKategorijeZaFormu>> = [];
  let error: string | null = null;

  try {
    kategorije = await fetchKategorijeZaFormu();
  } catch (e) {
    error = e instanceof Error ? e.message : "Greška";
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Oglas</span>
        <h1 className={styles.title}>Objavi uslugu</h1>
        <p className={styles.subtitle}>
          Popunite podatke o usluzi, mjestima rada i cijeni.
        </p>
      </header>
      <section className={`${styles.card} ${styles.cardWide}`}>
        {error ? (
          <p>Nije moguće učitati kategorije: {error}</p>
        ) : (
          <ObjaviUsluguForm
            korisnikId={korisnik.id}
            userUuid={korisnik.user_uuid}
            kategorije={kategorije}
          />
        )}
      </section>
    </div>
  );
}
