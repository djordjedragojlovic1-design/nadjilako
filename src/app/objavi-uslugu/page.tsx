import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  PageCard,
  PageHeader,
  PageShell,
} from "@/components/layout/PageShell";
import { ObjaviUsluguForm } from "@/components/usluge/ObjaviUsluguForm/ObjaviUsluguForm";
import { getViewerKorisnik } from "@/lib/korisnik/queries";
import { fetchKategorijeZaFormu } from "@/lib/usluge/queries";

export const metadata: Metadata = {
  title: "Objavi uslugu",
};

export default async function ObjaviUsluguPage() {
  const korisnik = await getViewerKorisnik();

  if (!korisnik) {
    redirect("/prijava?next=/objavi-uslugu");
  }

  let kategorije: Awaited<ReturnType<typeof fetchKategorijeZaFormu>> = [];
  let error: string | null = null;

  try {
    kategorije = await fetchKategorijeZaFormu();
  } catch (e) {
    error = e instanceof Error ? e.message : "Greška";
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Oglas"
        title="Objavi uslugu"
        subtitle="Popunite podatke o usluzi, mjestima rada i cijeni."
      />
      <PageCard wide>
        {error ? (
          <p className="text-muted-foreground">
            Nije moguće učitati kategorije: {error}
          </p>
        ) : (
          <ObjaviUsluguForm
            korisnikId={korisnik.id}
            userUuid={korisnik.user_uuid}
            kategorije={kategorije}
          />
        )}
      </PageCard>
    </PageShell>
  );
}
