import { IzdvojenoSection } from "@/components/usluge/IzdvojenoSection/IzdvojenoSection";
import { fetchIzdvojeneUsluge } from "@/lib/usluge/queries";
import styles from "@/styles/page.module.css";

export default async function HomePage() {
  let usluge: Awaited<ReturnType<typeof fetchIzdvojeneUsluge>> = [];
  let error: string | null = null;

  try {
    usluge = await fetchIzdvojeneUsluge();
  } catch (e) {
    error = e instanceof Error ? e.message : "Greška pri učitavanju usluga.";
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Početna</span>
        <h1 className={styles.title}>Pronađi uslugu brzo i lako</h1>
        <p className={styles.subtitle}>
          NadjiLako povezuje pružaoce usluga i klijente širom regiona — BiH,
          Srbija, Hrvatska i Crna Gora.
        </p>
      </header>

      {error ? (
        <section className={styles.card}>
          <p>Nije moguće učitati usluge: {error}</p>
        </section>
      ) : (
        <IzdvojenoSection usluge={usluge} />
      )}
    </div>
  );
}
