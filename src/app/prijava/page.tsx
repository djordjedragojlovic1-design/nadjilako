import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";
import styles from "@/styles/page.module.css";

export const metadata: Metadata = {
  title: "Prijava",
};

export default async function PrijavaPage({
  searchParams,
}: {
  searchParams: Promise<{ greska?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const { greska } = await searchParams;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Nalog</span>
        <h1 className={styles.title}>Prijava</h1>
        <p className={styles.subtitle}>Prijavite se na svoj NadjiLako nalog.</p>
      </header>
      <section className={`${styles.card} ${styles.cardNarrow}`}>
        {greska === "potvrda" && (
          <p className={styles.bannerError}>
            Potvrda emaila nije uspela. Pokušajte ponovo ili se prijavite.
          </p>
        )}
        <LoginForm />
      </section>
    </div>
  );
}
