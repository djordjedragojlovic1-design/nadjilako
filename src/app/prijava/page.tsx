import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PageCard,
  PageErrorBanner,
  PageHeader,
  PageShell,
} from "@/components/layout/PageShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Prijava",
  robots: { index: false, follow: false },
};

export default async function PrijavaPage({
  searchParams,
}: {
  searchParams: Promise<{ greska?: string; poruka?: string; uspjeh?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const { greska, poruka, uspjeh } = await searchParams;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Nalog"
        title="Prijava"
        subtitle="Prijavite se na svoj NadjiLako nalog."
      />
      <PageCard narrow>
        {uspjeh === "email" ? (
          <Alert className="mb-6 border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <AlertDescription>
              Email adresa je potvrđena. Sada se možete prijaviti.
            </AlertDescription>
          </Alert>
        ) : null}
        {greska === "potvrda" ? (
          <PageErrorBanner message="Potvrda emaila nije uspela. Pokušajte ponovo ili se prijavite." />
        ) : null}
        {greska === "profil" ? (
          <PageErrorBanner
            message={
              poruka ??
              "Email je potvrđen, ali kreiranje profila nije uspelo. Pokušajte ponovo da se prijavite."
            }
          />
        ) : null}
        <LoginForm />
      </PageCard>
    </PageShell>
  );
}
