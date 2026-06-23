import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader, PageShell } from "@/components/layout/PageShell";
import { KreditiView } from "@/components/krediti/KreditiView/KreditiView";
import { fetchKorisnikByUserUuid } from "@/lib/korisnik/queries";
import { fetchKreditTransakcije } from "@/lib/krediti/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Krediti",
  robots: { index: false, follow: false },
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
    <PageShell>
      <PageHeader
        eyebrow="Nalog"
        title="Krediti"
        subtitle="Dopunite kredite i koristite ih za promociju svojih usluga. Pratite stanje i istoriju transakcija."
      />

      <KreditiView stanje={korisnik.krediti} transakcije={transakcije} />
    </PageShell>
  );
}
