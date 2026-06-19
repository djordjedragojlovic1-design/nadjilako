import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { createClient } from "@/lib/supabase/server";
import styles from "@/styles/page.module.css";

export const metadata: Metadata = {
  title: "Registracija",
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
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Nalog</span>
        <h1 className={styles.title}>Registracija</h1>
        <p className={styles.subtitle}>
          Kreirajte besplatan nalog i počnite da nudite ili tražite usluge.
        </p>
      </header>
      <section className={`${styles.card} ${styles.cardNarrow}`}>
        <RegisterForm />
      </section>
    </div>
  );
}
