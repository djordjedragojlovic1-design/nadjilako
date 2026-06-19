import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UrediProfilForm } from "@/components/profil/UrediProfilForm/UrediProfilForm";
import { fetchKorisnikByUserUuid } from "@/lib/korisnik/queries";
import { createClient } from "@/lib/supabase/server";
import styles from "@/styles/page.module.css";

export const metadata: Metadata = {
  title: "Uredi profil",
};

export default async function UrediProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/prijava?next=/uredi-profil");
  }

  const korisnik = await fetchKorisnikByUserUuid(user.id);
  if (!korisnik) {
    redirect("/registracija");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Nalog</span>
        <h1 className={styles.title}>Uredi profil</h1>
        <p className={styles.subtitle}>
          Izmijenite svoje podatke, profilnu sliku, email i lozinku.
        </p>
      </header>

      <section className={`${styles.card} ${styles.cardWide}`}>
        <UrediProfilForm
          korisnikId={korisnik.id}
          userUuid={korisnik.user_uuid}
          initial={{
            ime: korisnik.ime,
            prezime: korisnik.prezime,
            korisnicko_ime: korisnik.korisnicko_ime,
            inf_o_korisniku: korisnik.inf_o_korisniku ?? "",
            drzava: korisnik.drzava,
            broj_telefona: korisnik.broj_telefona,
            profilna_slika: korisnik.profilna_slika,
            email: user.email ?? "",
            krediti: korisnik.krediti,
          }}
        />
      </section>
    </div>
  );
}
