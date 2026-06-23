import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader, PageShell } from "@/components/layout/PageShell";
import { PratiociView } from "@/components/pratioci/PratiociView";
import { fetchKorisnikByUserUuid } from "@/lib/korisnik/queries";
import { fetchPraceni, fetchPratioci } from "@/lib/pratioci/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pratioci",
  robots: { index: false, follow: false },
};

export default async function PratiociPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/prijava?next=/pratioci");
  }

  const korisnik = await fetchKorisnikByUserUuid(user.id);
  if (!korisnik) {
    redirect("/registracija");
  }

  const [pratioci, praceni] = await Promise.all([
    fetchPratioci(korisnik.id),
    fetchPraceni(korisnik.id),
  ]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Nalog"
        title="Pratioci"
        subtitle="Pregledajte naloge koji prate vaš profil i naloge koje vi pratite."
      />

      <PratiociView pratioci={pratioci} praceni={praceni} />
    </PageShell>
  );
}
