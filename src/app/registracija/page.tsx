import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { PageCard, PageHeader, PageShell } from "@/components/layout/PageShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Registracija",
  robots: { index: false, follow: false },
};

export default async function RegistracijaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Nalog"
        title="Registracija"
        subtitle="Kreirajte besplatan nalog i počnite da nudite ili tražite usluge."
      />
      <PageCard narrow>
        <RegisterForm />
      </PageCard>
    </PageShell>
  );
}
