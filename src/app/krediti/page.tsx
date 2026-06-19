import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KreditiView } from "@/components/krediti/KreditiView/KreditiView";
import { fetchKorisnikByUserUuid } from "@/lib/korisnik/queries";
import { fetchKreditTransakcije } from "@/lib/krediti/queries";
import { createClient } from "@/lib/supabase/server";
import styles from "@/styles/page.module.css";

export const metadata: Metadata = {
  title: "Krediti",
};

export default async function KreditiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/prijava?next=/krediti");
  }

  const korisnik = await fetchKorisnikByUserUuid(user.id);
  if (!korisnik) {
    redirect("/registracija");
  }

  const transakcije = await fetchKreditTransakcije(korisnik.id);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Nalog</span>
        <h1 className={styles.title}>Krediti</h1>
        <p className={styles.subtitle}>
          Dopunite kredite i koristite ih za promociju svojih usluga. Pratite
          stanje i istoriju transakcija.
        </p>
      </header>

      <KreditiView stanje={korisnik.krediti} transakcije={transakcije} />
    </div>
  );
}
