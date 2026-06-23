import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageCard, PageHeader, PageShell } from "@/components/layout/PageShell";
import { UrediProfilForm } from "@/components/profil/UrediProfilForm/UrediProfilForm";
import { fetchKorisnikByUserUuid } from "@/lib/korisnik/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Uredi profil",
  robots: { index: false, follow: false },
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
    <PageShell>
      <PageHeader
        eyebrow="Nalog"
        title="Uredi profil"
        subtitle="Izmijenite svoje podatke, profilnu sliku, email i lozinku."
      />

      <PageCard wide>
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
            lokacija: korisnik.lokacija ?? "",
            email: user.email ?? "",
            krediti: korisnik.krediti,
          }}
        />
      </PageCard>
    </PageShell>
  );
}
