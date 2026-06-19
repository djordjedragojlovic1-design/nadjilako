import type { Metadata } from "next";
import { AppLink } from "@/components/ui/AppLink";
import { PretragaFilteri } from "@/components/pretraga/PretragaFilteri/PretragaFilteri";
import { PretragaSort } from "@/components/pretraga/PretragaSort/PretragaSort";
import { UslugaCard } from "@/components/usluge/UslugaCard/UslugaCard";
import { DEFAULT_SORT, DEFAULT_VALUTA, isSortKey } from "@/lib/usluge/constants";
import { searchUsluge } from "@/lib/usluge/queries";
import type {
  PretragaFilteriValues,
  PretragaRezultat,
} from "@/lib/usluge/types";
import pageStyles from "@/styles/page.module.css";
import styles from "./Pretraga.module.css";

export const metadata: Metadata = {
  title: "Pretraga",
};

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
    <div className={pageStyles.page}>
      <header className={pageStyles.header}>
        <span className={pageStyles.eyebrow}>Pretraga</span>
        <h1 className={pageStyles.title}>
          {naslovKategorije ?? "Rezultati pretrage"}
        </h1>
        <p className={pageStyles.subtitle}>{subtitle}</p>
      </header>

      {error ? (
        <section className={pageStyles.card}>
          <p>Nije moguće učitati rezultate: {error}</p>
        </section>
      ) : rezultat ? (
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <PretragaFilteri filteri={filteriValues} facets={rezultat.facets} />
          </aside>

          <div className={styles.results}>
            <div className={styles.toolbar}>
              <p className={styles.count}>{brojLabela(rezultat.total)}</p>
              <PretragaSort value={sort} />
            </div>

            {rezultat.items.length === 0 ? (
              <section className={styles.empty}>
                <p>Nema usluga koje odgovaraju zadatim kriterijima.</p>
                <p className={styles.emptyCta}>
                  <AppLink href="/objavi-uslugu">Objavi uslugu</AppLink>
                </p>
              </section>
            ) : (
              <>
                <div className={styles.grid}>
                  {rezultat.items.map((usluga) => (
                    <UslugaCard key={usluga.id} usluga={usluga} />
                  ))}
                </div>

                {rezultat.totalPages > 1 && (
                  <nav className={styles.pagination} aria-label="Stranice rezultata">
                    <AppLink
                      href={buildHref(rezultat.page - 1)}
                      className={`${styles.pageLink} ${rezultat.page <= 1 ? styles.pageDisabled : ""}`}
                      aria-label="Prethodna stranica"
                      aria-disabled={rezultat.page <= 1}
                    >
                      ‹
                    </AppLink>

                    {pageNumbers(rezultat.page, rezultat.totalPages).map((p, i) =>
                      p === "..." ? (
                        <span key={`e-${i}`} className={styles.ellipsis}>
                          …
                        </span>
                      ) : (
                        <AppLink
                          key={p}
                          href={buildHref(p)}
                          className={`${styles.pageLink} ${p === rezultat.page ? styles.pageActive : ""}`}
                          aria-current={p === rezultat.page ? "page" : undefined}
                        >
                          {p}
                        </AppLink>
                      ),
                    )}

                    <AppLink
                      href={buildHref(rezultat.page + 1)}
                      className={`${styles.pageLink} ${rezultat.page >= rezultat.totalPages ? styles.pageDisabled : ""}`}
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
    </div>
  );
}
