import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ObrisiNalogConfirm } from "@/components/profil/ObrisiNalogSection/ObrisiNalogSection";
import { PageCard, PageHeader, PageShell } from "@/components/layout/PageShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Obriši nalog",
  robots: { index: false, follow: false },
};

export default async function ObrisiNalogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/prijava?next=/obrisi-nalog");
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Nalog"
        title="Potvrda brisanja naloga"
        subtitle="Email link je potvrđen. Ako ste sigurni, nastavite sa trajnim brisanjem."
      />
      <PageCard narrow>
        <ObrisiNalogConfirm />
      </PageCard>
    </PageShell>
  );
}
