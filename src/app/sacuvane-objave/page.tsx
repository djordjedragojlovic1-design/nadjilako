import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader, PageShell } from "@/components/layout/PageShell";
import { UslugaCard } from "@/components/usluge/UslugaCard/UslugaCard";
import { fetchKorisnikByUserUuid } from "@/lib/korisnik/queries";
import { fetchSacuvaneObjave } from "@/lib/sacuvane-objave/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sačuvane objave",
};

export default async function SacuvaneObjavePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/prijava?next=/sacuvane-objave");
  }

  const korisnik = await fetchKorisnikByUserUuid(user.id);
  if (!korisnik) {
    redirect("/registracija");
  }

  const usluge = await fetchSacuvaneObjave(korisnik.id);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Nalog"
        title="Sačuvane objave"
        subtitle="Objave drugih korisnika koje ste sačuvali za kasnije."
      />

      {usluge.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed px-8 py-12 text-center">
          Još niste sačuvali nijednu objavu. Otvorite uslugu i kliknite
          „Sačuvaj”.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {usluge.map((usluga) => (
            <UslugaCard key={usluga.id} usluga={usluga} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
