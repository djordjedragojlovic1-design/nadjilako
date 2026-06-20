import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageCard, PageHeader, PageShell } from "@/components/layout/PageShell";
import { VerifikacijaPanel } from "@/components/profil/VerifikacijaPanel/VerifikacijaPanel";
import { fetchKorisnikByUserUuid } from "@/lib/korisnik/queries";
import { createClient } from "@/lib/supabase/server";

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
    <PageShell>
      <PageHeader
        eyebrow="Nalog"
        title="Verifikacija"
        subtitle="Potvrdite svoju email adresu i broj telefona kako bi vaš profil bio pouzdaniji."
      />

      <PageCard wide>
        <VerifikacijaPanel
          korisnikId={korisnik.id}
          email={user.email ?? ""}
          emailVerifikovan={Boolean(user.email_confirmed_at)}
          brojTelefona={korisnik.broj_telefona}
          telefonVerifikovan={korisnik.telefon_verifikovan}
        />
      </PageCard>
    </PageShell>
  );
}
