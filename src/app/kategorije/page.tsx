import type { Metadata } from "next";
import { KategorijeBrowser } from "@/components/kategorije/KategorijeBrowser/KategorijeBrowser";
import { fetchKategorijeStablo } from "@/lib/usluge/queries";
import type { KategorijaCvor } from "@/lib/usluge/types";
import styles from "@/styles/page.module.css";

export const metadata: Metadata = {
  title: "Kategorije",
};

export default async function KategorijePage() {
  let stablo: KategorijaCvor[] = [];
  let error: string | null = null;

  try {
    stablo = await fetchKategorijeStablo();
  } catch (e) {
    error = e instanceof Error ? e.message : "Greška pri učitavanju kategorija.";
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Kategorije usluga</h1>
      </header>
      {error ? (
        <section className={styles.card}>
          <p>Nije moguće učitati kategorije: {error}</p>
        </section>
      ) : (
        <KategorijeBrowser stablo={stablo} />
      )}
    </div>
  );
}
