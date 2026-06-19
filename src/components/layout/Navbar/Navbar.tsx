"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { signOutClient } from "@/lib/auth/client-actions";
import { getInitials } from "@/lib/auth/korisnik";
import { fetchUnreadCount } from "@/lib/chat/client";
import { createClient } from "@/lib/supabase/client";
import styles from "./Navbar.module.css";

function useUnreadPoruke(korisnikId: number | null, pathname: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (korisnikId == null) {
      setCount(0);
      return;
    }

    let active = true;
    const osvjezi = () => {
      void fetchUnreadCount(korisnikId).then((n) => {
        if (active) setCount(n);
      });
    };

    osvjezi();

    const supabase = createClient();
    const channel = supabase
      .channel("navbar-unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "poruke" },
        osvjezi,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "poruke" },
        osvjezi,
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [korisnikId, pathname]);

  return count;
}

const NAV_LINKS = [
  { href: "/", label: "Početna" },
  { href: "/kategorije", label: "Kategorije" },
  { href: "/pretraga", label: "Pretraga" },
] as const;

function SearchIcon() {
  return (
    <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ThemeIcon({ theme }: { theme: "light" | "dark" }) {
  if (theme === "dark") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 14.5A8.5 8.5 0 1111.5 4 6.5 6.5 0 0021 14.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchField({
  className,
  onSubmit,
}: {
  className?: string;
  onSubmit?: () => void;
}) {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    if (typeof q === "string" && q.trim()) {
      router.push(`/pretraga?q=${encodeURIComponent(q.trim())}`);
    } else {
      router.push("/pretraga");
    }
    onSubmit?.();
  };

  return (
    <form className={`${styles.searchForm} ${className ?? ""}`} onSubmit={handleSubmit}>
      <SearchIcon />
      <input
        type="search"
        name="q"
        className={styles.searchInput}
        placeholder="Pretraži usluge..."
        aria-label="Pretraga usluga"
      />
    </form>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {NAV_LINKS.map(({ href, label }) => (
        <AppLink
          key={href}
          href={href}
          className={`${styles.navLink} ${pathname === href ? styles.navLinkActive : ""}`}
          onClick={onNavigate}
        >
          {label}
        </AppLink>
      ))}
    </>
  );
}

function UserMenu({
  profilHref,
  initials,
  avatarUrl,
  onClose,
}: {
  profilHref: string;
  initials: string;
  avatarUrl: string | null;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const close = () => {
    setOpen(false);
    onClose?.();
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOutClient();
    close();
    router.refresh();
    router.push("/");
  };

  return (
    <div className={styles.userMenuWrap} ref={ref}>
      <button
        type="button"
        className={styles.avatarBtn}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Korisnički meni"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={36}
            height={36}
            className={styles.avatarImg}
          />
        ) : (
          initials
        )}
      </button>
      {open && (
        <div className={styles.dropdown} role="menu">
          <AppLink
            href={profilHref}
            className={styles.dropdownItem}
            role="menuitem"
            onClick={close}
          >
            Profil
          </AppLink>
          <AppLink
            href="/uredi-profil"
            className={styles.dropdownItem}
            role="menuitem"
            onClick={close}
          >
            Uredi profil
          </AppLink>
          <AppLink
            href="/krediti"
            className={styles.dropdownItem}
            role="menuitem"
            onClick={close}
          >
            Krediti
          </AppLink>
          <AppLink
            href="/verifikacija"
            className={styles.dropdownItem}
            role="menuitem"
            onClick={close}
          >
            Verifikacija
          </AppLink>
          <div className={styles.dropdownDivider} />
          <button
            type="button"
            className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
            role="menuitem"
            disabled={signingOut}
            onClick={handleSignOut}
          >
            {signingOut ? "Odjava..." : "Odjavi se"}
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, korisnik, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const unread = useUnreadPoruke(korisnik?.id ?? null, pathname);

  const isLoggedIn = Boolean(user);
  const profilHref = korisnik
    ? `/profil/${korisnik.id ?? korisnik.user_uuid}`
    : user
      ? `/profil/${user.id}`
      : "/profil";
  const initials = korisnik
    ? getInitials(korisnik)
    : (user?.email?.charAt(0).toUpperCase() ?? "?");

  const closeMobile = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <AppLink href="/" className={styles.logo}>
          <span className={styles.logoMark}>NL</span>
          <span>NadjiLako</span>
        </AppLink>

        <nav className={styles.nav} aria-label="Glavna navigacija">
          <NavLinks />
        </nav>

        <div className={styles.searchWrap}>
          <SearchField />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.themeBtn}
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Uključi tamni mod" : "Uključi svetli mod"}
          >
            <ThemeIcon theme={theme} />
          </button>

          {loading ? (
            <span className={styles.authSkeleton} aria-hidden />
          ) : isLoggedIn ? (
            <div className={styles.userArea}>
              <AppLink href="/krediti" className={styles.credits} aria-label="Krediti">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M12 7v10M9 10h6M9 14h6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span>{korisnik?.krediti ?? 0}</span>
                <span>kredita</span>
              </AppLink>
              <span className={styles.chatLinkWrap}>
                <AppLink href="/chat" className={styles.iconBtn} aria-label="Poruke">
                  <ChatIcon />
                </AppLink>
                {unread > 0 && (
                  <span className={styles.chatBadge} aria-label={`${unread} nepročitanih`}>
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </span>
              <UserMenu
                profilHref={profilHref}
                initials={initials}
                avatarUrl={korisnik?.profilna_slika ?? null}
              />
            </div>
          ) : (
            <div className={styles.authBtns}>
              <AppLink href="/prijava" className={styles.btnGhost}>
                Prijava
              </AppLink>
              <AppLink href="/registracija" className={styles.btnPrimary}>
                Registracija
              </AppLink>
            </div>
          )}

          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Zatvori meni" : "Otvori meni"}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              {menuOpen ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`${styles.overlay} ${menuOpen ? styles.overlayVisible : ""}`}
        onClick={closeMobile}
        aria-hidden
      />

      <div
        className={`${styles.mobilePanel} ${menuOpen ? styles.mobilePanelOpen : ""}`}
        aria-hidden={!menuOpen}
      >
        <nav className={styles.mobileNav} aria-label="Mobilna navigacija">
          <NavLinks onNavigate={closeMobile} />
        </nav>
        <div className={styles.mobileSearch}>
          <SearchField onSubmit={closeMobile} />
        </div>
        {!loading && !isLoggedIn && (
          <div className={styles.mobileAuth}>
            <AppLink href="/prijava" className={styles.btnGhost} onClick={closeMobile}>
              Prijava
            </AppLink>
            <AppLink href="/registracija" className={styles.btnPrimary} onClick={closeMobile}>
              Registracija
            </AppLink>
          </div>
        )}
      </div>
    </header>
  );
}
