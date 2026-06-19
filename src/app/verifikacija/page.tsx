import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VerifikacijaPanel } from "@/components/profil/VerifikacijaPanel/VerifikacijaPanel";
import { fetchKorisnikByUserUuid } from "@/lib/korisnik/queries";
import { createClient } from "@/lib/supabase/server";
import styles from "@/styles/page.module.css";

export const metadata: Metadata = {
  title: "Verifikacija",
};

export default async function VerifikacijaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/prijava?next=/verifikacija");
  }

  const korisnik = await fetchKorisnikByUserUuid(user.id);
  if (!korisnik) {
    redirect("/registracija");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Nalog</span>
        <h1 className={styles.title}>Verifikacija</h1>
        <p className={styles.subtitle}>
          Potvrdite svoju email adresu i broj telefona kako bi vaš profil bio
          pouzdaniji.
        </p>
      </header>

      <section className={`${styles.card} ${styles.cardWide}`}>
        <VerifikacijaPanel
          korisnikId={korisnik.id}
          email={user.email ?? ""}
          emailVerifikovan={Boolean(user.email_confirmed_at)}
          brojTelefona={korisnik.broj_telefona}
          telefonVerifikovan={korisnik.telefon_verifikovan}
        />
      </section>
    </div>
  );
}
