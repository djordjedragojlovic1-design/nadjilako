"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Coins,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import { AppLink } from "@/components/ui/AppLink";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { signOutClient } from "@/lib/auth/client-actions";
import { getInitials } from "@/lib/auth/korisnik";
import { fetchUnreadCount } from "@/lib/chat/client";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
    <form className={cn("relative", className)} onSubmit={handleSubmit}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        type="search"
        name="q"
        className="bg-muted rounded-full pl-9"
        placeholder="Pretraži usluge..."
        aria-label="Pretraga usluga"
      />
    </form>
  );
}

function NavLinks({
  onNavigate,
  className,
  linkClassName,
}: {
  onNavigate?: () => void;
  className?: string;
  linkClassName?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={className} aria-label="Glavna navigacija">
      {NAV_LINKS.map(({ href, label }) => (
        <AppLink
          key={href}
          href={href}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground",
            pathname === href && "bg-accent text-accent-foreground",
            linkClassName,
          )}
          onClick={onNavigate}
        >
          {label}
        </AppLink>
      ))}
    </nav>
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
  const [signingOut, setSigningOut] = useState(false);

  const close = () => onClose?.();

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOutClient();
    close();
    router.refresh();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full p-0"
            aria-label="Korisnički meni"
          />
        }
      >
        <Avatar className="size-9">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt="" />
          ) : null}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => { close(); router.push(profilHref); }}>
          Profil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { close(); router.push("/uredi-profil"); }}>
          Uredi profil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { close(); router.push("/krediti"); }}>
          Krediti
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { close(); router.push("/verifikacija"); }}>
          Verifikacija
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={signingOut}
          onClick={handleSignOut}
        >
          {signingOut ? "Odjava..." : "Odjavi se"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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

  return (
    <header className="bg-background h-16 border-b shadow-sm">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-4 px-4">
        <AppLink
          href="/"
          className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight transition-colors hover:text-primary"
        >
          <span className="bg-primary flex size-8 items-center justify-center rounded-md text-sm font-extrabold text-white dark:text-black">
            NL
          </span>
          <span>NadjiLako</span>
        </AppLink>

        <NavLinks className="hidden items-center gap-0.5 min-[901px]:flex" />

        <div className="mx-auto hidden max-w-md flex-1 min-[901px]:block">
          <SearchField />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Uključi tamni mod" : "Uključi svetli mod"}
          >
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>

          {loading ? (
            <div
              className="bg-muted h-9 w-32 animate-pulse rounded-md"
              aria-hidden
            />
          ) : isLoggedIn ? (
            <div className="flex items-center gap-1">
              <AppLink
                href="/krediti"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "hidden gap-1.5 rounded-full sm:inline-flex",
                )}
                aria-label="Krediti"
              >
                <Coins className="size-4" />
                <span>{korisnik?.krediti ?? 0}</span>
                <span className="max-[480px]:hidden">kredita</span>
              </AppLink>
              <div className="relative">
                <AppLink
                  href="/chat"
                  className={buttonVariants({ variant: "ghost", size: "icon" })}
                  aria-label="Poruke"
                >
                  <MessageCircle className="size-5" />
                </AppLink>
                {unread > 0 && (
                  <Badge
                    variant="destructive"
                    className="pointer-events-none absolute -top-1 -right-1 size-4 justify-center p-0 text-[0.65rem]"
                    aria-label={`${unread} nepročitanih`}
                  >
                    {unread > 99 ? "99+" : unread}
                  </Badge>
                )}
              </div>
              <UserMenu
                profilHref={profilHref}
                initials={initials}
                avatarUrl={korisnik?.profilna_slika ?? null}
              />
            </div>
          ) : (
            <div className="hidden items-center gap-1 min-[901px]:flex">
              <AppLink
                href="/prijava"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Prijava
              </AppLink>
              <AppLink
                href="/registracija"
                className={buttonVariants({ size: "sm" })}
              >
                Registracija
              </AppLink>
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-[901px]:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Zatvori meni" : "Otvori meni"}
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </Button>
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Navigacija</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-6 px-4">
            <NavLinks
              className="flex flex-col items-stretch gap-1"
              linkClassName="justify-start px-3 py-2.5 text-base"
              onNavigate={closeMobile}
            />
            <SearchField onSubmit={closeMobile} />
            {!loading && !isLoggedIn && (
              <div className="flex flex-col gap-2 border-t pt-4">
                <AppLink
                  href="/prijava"
                  className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                  onClick={closeMobile}
                >
                  Prijava
                </AppLink>
                <AppLink
                  href="/registracija"
                  className={cn(buttonVariants(), "w-full")}
                  onClick={closeMobile}
                >
                  Registracija
                </AppLink>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
