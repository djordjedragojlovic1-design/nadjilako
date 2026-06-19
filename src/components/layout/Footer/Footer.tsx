import { AppLink } from "@/components/ui/AppLink";
import styles from "./Footer.module.css";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <p className={styles.brand}>NadjiLako</p>
          <p className={styles.tagline}>
            Povezujemo pružaoce usluga i klijente u regionu.
          </p>
        </div>
        <nav className={styles.links} aria-label="Footer navigacija">
          <AppLink href="/kategorije" className={styles.link}>
            Kategorije
          </AppLink>
          <AppLink href="/pretraga" className={styles.link}>
            Pretraga
          </AppLink>
          <AppLink href="/prijava" className={styles.link}>
            Prijava
          </AppLink>
        </nav>
        <p className={styles.copy}>
          © {year} NadjiLako. BiH · Srbija · Hrvatska · Crna Gora
        </p>
      </div>
    </footer>
  );
}
