import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PageCard, PageHeader, PageShell } from "@/components/layout/PageShell";
import { AppLink } from "@/components/ui/AppLink";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PretragaFilteri } from "@/components/pretraga/PretragaFilteri/PretragaFilteri";
import { PretragaSort } from "@/components/pretraga/PretragaSort/PretragaSort";
import { UslugaCard } from "@/components/usluge/UslugaCard/UslugaCard";
import { cn } from "@/lib/utils";
import { DEFAULT_SORT, DEFAULT_VALUTA, isSortKey } from "@/lib/usluge/constants";
import { searchUsluge } from "@/lib/usluge/queries";
import type {
  PretragaFilteriValues,
  PretragaRezultat,
} from "@/lib/usluge/types";

type PretragaPageProps = {
  searchParams: Promise<{
    q?: string;
    kategorija?: string;
    drzava?: string;
    grad?: string;
    tip?: string;
    valuta?: string;
    cijena_min?: string;
    cijena_max?: string;
    ocjena?: string;
    sort?: string;
    page?: string;
  }>;
};

export async function generateMetadata({
  searchParams,
}: PretragaPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const kategorija = sp.kategorija?.trim();
  const strana = Number(sp.page);
  const hasPaging = Number.isFinite(strana) && strana > 1;

  const hasOtherFilters = Boolean(
    q ||
      sp.drzava?.trim() ||
      sp.grad?.trim() ||
      sp.tip?.trim() ||
      sp.ocjena?.trim() ||
      (sp.sort && sp.sort !== DEFAULT_SORT) ||
      hasPaging,
  );

  // Indeksiramo samo čistu pretragu ili stranicu jedne kategorije;
  // kombinacije filtera/pretrage ostaju van indeksa (izbjegavamo duplikate).
  const onlyKategorija = Boolean(kategorija) && !hasOtherFilters;
  const indexable = onlyKategorija || (!kategorija && !hasOtherFilters);

  const canonical = onlyKategorija
    ? `/pretraga?kategorija=${encodeURIComponent(kategorija as string)}`
    : "/pretraga";

  const title = q ? `Pretraga: ${q}` : "Pretraga usluga";
  const description =
    "Pretraži i filtriraj usluge po kategoriji, lokaciji, cijeni i ocjeni na NadjiLako platformi.";

  return {
    title,
    description,
    alternates: { canonical },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: canonical },
  };
}

function toNum(value: string | undefined): number | undefined {
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function brojLabela(broj: number): string {
  if (broj === 1) return "1 usluga";
  if (broj >= 2 && broj <= 4) return `${broj} usluge`;
  return `${broj} usluga`;
}

function pageNumbers(current: number, total: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= current - 1 && p <= current + 1)) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }
  return pages;
}

export default async function PretragaPage({ searchParams }: PretragaPageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const kategorija = sp.kategorija?.trim() || undefined;
  const drzava = sp.drzava?.trim() || undefined;
  const grad = sp.grad?.trim() || undefined;
  const tip = sp.tip?.trim() || undefined;
  const valuta = sp.valuta?.trim() || undefined;
  const cijenaMin = toNum(sp.cijena_min);
  const cijenaMax = toNum(sp.cijena_max);
  const ocjena = toNum(sp.ocjena);
  const sort = isSortKey(sp.sort) ? sp.sort : DEFAULT_SORT;
  const trazenaStrana = Number(sp.page);
  const page = Number.isFinite(trazenaStrana) && trazenaStrana > 0 ? trazenaStrana : 1;

  let rezultat: PretragaRezultat | null = null;
  let error: string | null = null;

  try {
    rezultat = await searchUsluge({
      q,
      kategorija,
      drzava,
      grad,
      tip,
      valuta,
      cijenaMin,
      cijenaMax,
      ocjena,
      sort,
      page,
    });
  } catch (e) {
    error = e instanceof Error ? e.message : "Greška pri pretrazi.";
  }

  const naslovKategorije = rezultat?.kategorija?.naziv ?? null;
  const subtitle = naslovKategorije
    ? q
      ? `Kategorija „${naslovKategorije}" · pojam „${q}"`
      : `Kategorija „${naslovKategorije}"`
    : q
      ? `Prikaz rezultata za: „${q}"`
      : "Filtriraj ponudu ili unesi pojam u navigacionu traku.";

  const filteriValues: PretragaFilteriValues = {
    q,
    kategorija: kategorija ?? null,
    drzava: drzava ?? null,
    grad: grad ?? null,
    tip: tip ?? null,
    valuta: valuta ?? DEFAULT_VALUTA,
    cijenaMin: cijenaMin ?? null,
    cijenaMax: cijenaMax ?? null,
    ocjena: ocjena ?? null,
  };

  const buildHref = (targetPage: number): string => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (kategorija) params.set("kategorija", kategorija);
    if (drzava) params.set("drzava", drzava);
    if (grad) params.set("grad", grad);
    if (tip) {
      params.set("tip", tip);
      if (valuta && valuta !== DEFAULT_VALUTA) params.set("valuta", valuta);
      if (cijenaMin != null) params.set("cijena_min", String(cijenaMin));
      if (cijenaMax != null) params.set("cijena_max", String(cijenaMax));
    }
    if (ocjena != null) params.set("ocjena", String(ocjena));
    if (sort !== DEFAULT_SORT) params.set("sort", sort);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/pretraga?${qs}` : "/pretraga";
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Pretraga"
        title={naslovKategorije ?? "Rezultati pretrage"}
        subtitle={subtitle}
      />

      <form action="/pretraga" className="relative mb-2 min-[901px]:hidden">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          name="q"
          defaultValue={q}
          className="bg-muted rounded-full pl-9"
          placeholder="Pretraži usluge..."
          aria-label="Pretraga usluga"
        />
        {kategorija ? <input type="hidden" name="kategorija" value={kategorija} /> : null}
        {drzava ? <input type="hidden" name="drzava" value={drzava} /> : null}
        {grad ? <input type="hidden" name="grad" value={grad} /> : null}
        {tip ? <input type="hidden" name="tip" value={tip} /> : null}
        {tip && valuta ? <input type="hidden" name="valuta" value={valuta} /> : null}
        {tip && cijenaMin != null ? (
          <input type="hidden" name="cijena_min" value={cijenaMin} />
        ) : null}
        {tip && cijenaMax != null ? (
          <input type="hidden" name="cijena_max" value={cijenaMax} />
        ) : null}
        {ocjena != null ? <input type="hidden" name="ocjena" value={ocjena} /> : null}
        {sort !== DEFAULT_SORT ? <input type="hidden" name="sort" value={sort} /> : null}
      </form>

      {error ? (
        <PageCard>
          <p>Nije moguće učitati rezultate: {error}</p>
        </PageCard>
      ) : rezultat ? (
        <div className="grid grid-cols-1 items-start gap-4 min-[881px]:grid-cols-[16rem_1fr] min-[881px]:gap-8">
          <aside className="min-[881px]:sticky min-[881px]:top-[calc(var(--navbar-height)+1rem)]">
            <PretragaFilteri filteri={filteriValues} facets={rezultat.facets} />
          </aside>

          <div className="min-w-0">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-muted-foreground text-[0.9375rem]">
                {brojLabela(rezultat.total)}
              </p>
              <PretragaSort value={sort} />
            </div>

            {rezultat.items.length === 0 ? (
              <section className="text-muted-foreground rounded-xl border border-dashed p-12 text-center">
                <p>Nema usluga koje odgovaraju zadatim kriterijima.</p>
                <p className="mt-4">
                  <AppLink
                    href="/objavi-uslugu"
                    className="text-primary font-semibold"
                  >
                    Objavi uslugu
                  </AppLink>
                </p>
              </section>
            ) : (
              <>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                  {rezultat.items.map((usluga) => (
                    <UslugaCard key={usluga.id} usluga={usluga} />
                  ))}
                </div>

                {rezultat.totalPages > 1 && (
                  <nav
                    className="mt-8 flex flex-wrap items-center justify-center gap-1"
                    aria-label="Stranice rezultata"
                  >
                    <AppLink
                      href={buildHref(rezultat.page - 1)}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "size-10 min-w-10 px-3",
                        rezultat.page <= 1 && "pointer-events-none opacity-45",
                      )}
                      aria-label="Prethodna stranica"
                      aria-disabled={rezultat.page <= 1}
                    >
                      ‹
                    </AppLink>

                    {pageNumbers(rezultat.page, rezultat.totalPages).map((p, i) =>
                      p === "..." ? (
                        <span
                          key={`e-${i}`}
                          className="text-muted-foreground inline-flex h-10 min-w-8 items-center justify-center"
                        >
                          …
                        </span>
                      ) : (
                        <AppLink
                          key={p}
                          href={buildHref(p)}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "size-10 min-w-10 px-3",
                            p === rezultat.page &&
                              "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                          )}
                          aria-current={p === rezultat.page ? "page" : undefined}
                        >
                          {p}
                        </AppLink>
                      ),
                    )}

                    <AppLink
                      href={buildHref(rezultat.page + 1)}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "size-10 min-w-10 px-3",
                        rezultat.page >= rezultat.totalPages &&
                          "pointer-events-none opacity-45",
                      )}
                      aria-label="Sljedeća stranica"
                      aria-disabled={rezultat.page >= rezultat.totalPages}
                    >
                      ›
                    </AppLink>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
