import { AppLink } from "@/components/ui/AppLink";
import { cn } from "@/lib/utils";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-card mt-auto border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:flex-nowrap">
        <div>
          <p className="font-bold">NadjiLako</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Povezujemo pružaoce usluga i klijente u regionu.
          </p>
        </div>
        <nav className="flex flex-wrap gap-4" aria-label="Footer navigacija">
          <AppLink
            href="/kategorije"
            className="text-muted-foreground hover:text-primary text-sm transition-colors"
          >
            Kategorije
          </AppLink>
          <AppLink
            href="/pretraga"
            className="text-muted-foreground hover:text-primary text-sm transition-colors"
          >
            Pretraga
          </AppLink>
          <AppLink
            href="/prijava"
            className="text-muted-foreground hover:text-primary text-sm transition-colors"
          >
            Prijava
          </AppLink>
        </nav>
        <p
          className={cn(
            "text-muted-foreground w-full border-t pt-4 text-center text-[0.8125rem]",
            "sm:w-auto sm:border-t-0 sm:pt-0 sm:text-right",
          )}
        >
          © {year} NadjiLako. BiH · Srbija · Hrvatska · Crna Gora
        </p>
      </div>
    </footer>
  );
}
