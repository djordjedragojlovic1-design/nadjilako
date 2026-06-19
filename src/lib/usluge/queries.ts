import { createClient } from "@/lib/supabase/server";
import { GRADOVI_PO_DRZAVI } from "@/lib/lokacije/gradovi";
import { DRZAVE } from "@/types/database";
import {
  DEFAULT_SORT,
  DEFAULT_VALUTA,
  IZDVJENO_MAX,
  KURS_U_BAM,
  MIN_OCJENA_OPCIJE,
  PRETRAGA_PER_PAGE,
  TIP_CIJENE_OPTIONS,
  type UslugaSortKey,
} from "./constants";
import type {
  KategorijaCvor,
  KorisnikReviewStats,
  OdgovorItem,
  PretragaFacets,
  PretragaRezultat,
  RecenzijaItem,
  UslugaDetail,
  UslugaListItem,
} from "./types";
import {
  buildReviewStats,
  cijenaUBAM,
  getReviewAverage,
  getReviewCount,
  isUslugaActive,
  normalizePromocija,
  parseMjestaRada,
  pickCoverImage,
  resolveSlikaUrl,
  sortIzdvojenoUsluge,
  truncateText,
} from "./utils";

type UslugaWithRelations = {
  id: number;
  naziv: string;
  informacije: string | null;
  tip: string | null;
  promocija?: string | null;
  promovisano_do?: string | null;
  promovisano_od?: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
  mjesta_rada: unknown;
  cijena: number | null;
  tip_cijene: string | null;
  valuta: string | null;
  korisnik_id: number;
  kategorija_id: number | null;
  updated_at: string;
  slike: { id: number; slika_url: string; sort_order: number | null }[] | null;
  korisnik: {
    id: number;
    ime: string;
    prezime: string;
    korisnicko_ime: string;
    profilna_slika: string | null;
  } | null;
};

async function fetchReviewStats(uslugaIds?: number[]) {
  const supabase = await createClient();
  let query = supabase
    .from("recenzije")
    .select("usluga_id, ocjena")
    .is("parent_id", null);

  if (uslugaIds?.length) {
    query = query.in("usluga_id", uslugaIds);
  } else {
    query = query.not("usluga_id", "is", null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return buildReviewStats(data ?? []);
}

export async function fetchIzdvojeneUsluge(): Promise<UslugaListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("usluge")
    .select(
      `
      id,
      naziv,
      informacije,
      tip,
      promocija,
      promovisano_do,
      status,
      expires_at,
      created_at,
      cijena,
      tip_cijene,
      valuta,
      slike ( id, slika_url, sort_order )
    `,
    )
    .eq("status", "aktivno")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    if (error.message.includes("promocija")) {
      const fallback = await supabase
        .from("usluge")
        .select(
          `
          id,
          naziv,
          informacije,
          tip,
          status,
          expires_at,
          created_at,
          cijena,
          tip_cijene,
          valuta,
          slike ( id, slika_url, sort_order )
        `,
        )
        .eq("status", "aktivno")
        .order("created_at", { ascending: false })
        .limit(200);

      if (fallback.error) throw fallback.error;
      return mapToListItems(
        (fallback.data ?? []) as unknown as UslugaWithRelations[],
        await fetchReviewStats(),
      );
    }
    throw error;
  }

  const active = ((data ?? []) as unknown as UslugaWithRelations[]).filter(
    isUslugaActive,
  );
  const stats = await fetchReviewStats(active.map((u) => u.id));
  const sorted = sortIzdvojenoUsluge(mapToListItems(active, stats));
  return sorted.slice(0, IZDVJENO_MAX);
}

function mapToListItems(
  rows: Omit<
    UslugaWithRelations,
    "mjesta_rada" | "korisnik_id" | "kategorija_id" | "updated_at" | "korisnik"
  >[],
  stats: ReturnType<typeof buildReviewStats>,
): UslugaListItem[] {
  return rows.map((row) => ({
    id: row.id,
    naziv: row.naziv,
    informacije: truncateText(row.informacije),
    promocija: normalizePromocija(row.promocija, row.tip, row.promovisano_do),
    created_at: row.created_at,
    slikaUrl: pickCoverImage(row.slike),
    prosecnaOcjena: getReviewAverage(stats, row.id),
    brojRecenzija: getReviewCount(stats, row.id),
    cijena: row.cijena != null ? Number(row.cijena) : null,
    tip_cijene: row.tip_cijene ?? null,
    valuta: row.valuta ?? null,
  }));
}

export async function fetchUslugaById(id: number): Promise<UslugaDetail | null> {
  const supabase = await createClient();

  let query = supabase
    .from("usluge")
    .select(
      `
      *,
      slike ( id, slika_url, sort_order ),
      korisnik:korisnik_id (
        id,
        ime,
        prezime,
        korisnicko_ime,
        profilna_slika
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  let { data, error } = await query;

  if (error?.message.includes("promocija")) {
    const fallback = await supabase
      .from("usluge")
      .select(
        `
        *,
        slike ( id, slika_url, sort_order ),
        korisnik:korisnik_id (
          id,
          ime,
          prezime,
          korisnicko_ime,
          profilna_slika
        )
      `,
      )
      .eq("id", id)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as UslugaWithRelations & {
    promocija?: string | null;
  };

  const stats = await fetchReviewStats([id]);
  const slikeSorted = [...(row.slike ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  return {
    id: row.id,
    korisnik_id: row.korisnik_id,
    kategorija_id: row.kategorija_id,
    tip: row.tip,
    promocija: normalizePromocija(row.promocija, row.tip, row.promovisano_do),
    promovisano_do: row.promovisano_do ?? null,
    promovisano_od: row.promovisano_od ?? null,
    naziv: row.naziv,
    informacije: row.informacije,
    status: row.status,
    mjesta_rada: parseMjestaRada(row.mjesta_rada as Parameters<typeof parseMjestaRada>[0]),
    cijena: row.cijena != null ? Number(row.cijena) : null,
    tip_cijene: row.tip_cijene,
    valuta: row.valuta,
    created_at: row.created_at,
    updated_at: row.updated_at,
    expires_at: row.expires_at,
    mjesta: parseMjestaRada(row.mjesta_rada as Parameters<typeof parseMjestaRada>[0]),
    slike: slikeSorted.map((s) => resolveSlikaUrl(s.slika_url)),
    slikeRows: slikeSorted.map((s) => ({
      id: s.id,
      url: resolveSlikaUrl(s.slika_url),
      sort_order: s.sort_order,
    })),
    prosecnaOcjena: getReviewAverage(stats, id),
    brojRecenzija: getReviewCount(stats, id),
    pruzalac: row.korisnik,
  };
}

export async function fetchUslugeByKorisnikId(
  korisnikId: number,
): Promise<UslugaListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("usluge")
    .select(
      `
      id,
      naziv,
      informacije,
      tip,
      promocija,
      promovisano_do,
      status,
      expires_at,
      created_at,
      cijena,
      tip_cijene,
      valuta,
      slike ( id, slika_url, sort_order )
    `,
    )
    .eq("korisnik_id", korisnikId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("promocija")) {
      const fallback = await supabase
        .from("usluge")
        .select(
          `
          id,
          naziv,
          informacije,
          tip,
          status,
          expires_at,
          created_at,
          cijena,
          tip_cijene,
          valuta,
          slike ( id, slika_url, sort_order )
        `,
        )
        .eq("korisnik_id", korisnikId)
        .order("created_at", { ascending: false });

      if (fallback.error) throw fallback.error;
      const fallbackRows = (fallback.data ?? []) as unknown as UslugaWithRelations[];
      const stats = await fetchReviewStats(fallbackRows.map((u) => u.id));
      return mapToListItems(fallbackRows, stats);
    }
    throw error;
  }

  const rows = (data ?? []) as unknown as UslugaWithRelations[];
  const stats = await fetchReviewStats(rows.map((u) => u.id));
  return mapToListItems(rows, stats);
}

export async function fetchKategorije(): Promise<
  { id: number; naziv: string; slug: string | null }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kategorije")
    .select("id, naziv, slug")
    .order("naziv");

  if (error) throw error;
  return data ?? [];
}

export async function fetchKategorijeZaFormu(): Promise<
  { id: number; naziv: string; parentNaziv: string | null }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kategorije")
    .select("id, naziv, parent_id");
  if (error) throw error;

  const sve = (data ?? []) as {
    id: number;
    naziv: string;
    parent_id: number | null;
  }[];

  const djecaPoRoditelju = new Map<number, typeof sve>();
  for (const k of sve) {
    if (k.parent_id == null) continue;
    const arr = djecaPoRoditelju.get(k.parent_id) ?? [];
    arr.push(k);
    djecaPoRoditelju.set(k.parent_id, arr);
  }

  const poNazivu = (a: { naziv: string }, b: { naziv: string }) =>
    a.naziv.localeCompare(b.naziv, "sr");

  const rezultat: { id: number; naziv: string; parentNaziv: string | null }[] = [];
  for (const roditelj of sve
    .filter((k) => k.parent_id == null)
    .sort(poNazivu)) {
    rezultat.push({ id: roditelj.id, naziv: roditelj.naziv, parentNaziv: null });
    for (const dijete of (djecaPoRoditelju.get(roditelj.id) ?? []).sort(poNazivu)) {
      rezultat.push({
        id: dijete.id,
        naziv: dijete.naziv,
        parentNaziv: roditelj.naziv,
      });
    }
  }

  return rezultat;
}

export async function fetchKategorijeStablo(): Promise<KategorijaCvor[]> {
  const supabase = await createClient();

  const { data: kategorije, error } = await supabase
    .from("kategorije")
    .select("id, naziv, slug, parent_id");
  if (error) throw error;

  const { data: usluge, error: uslugeError } = await supabase
    .from("usluge")
    .select("kategorija_id, status, expires_at");
  if (uslugeError) throw uslugeError;

  const brojPoKategoriji = new Map<number, number>();
  for (const u of usluge ?? []) {
    if (u.kategorija_id == null) continue;
    if (!isUslugaActive(u)) continue;
    brojPoKategoriji.set(
      u.kategorija_id,
      (brojPoKategoriji.get(u.kategorija_id) ?? 0) + 1,
    );
  }

  const sve = (kategorije ?? []) as {
    id: number;
    naziv: string;
    slug: string | null;
    parent_id: number | null;
  }[];

  const djecaPoRoditelju = new Map<number, typeof sve>();
  for (const k of sve) {
    if (k.parent_id == null) continue;
    const arr = djecaPoRoditelju.get(k.parent_id) ?? [];
    arr.push(k);
    djecaPoRoditelju.set(k.parent_id, arr);
  }

  const poNazivu = (a: { naziv: string }, b: { naziv: string }) =>
    a.naziv.localeCompare(b.naziv, "sr");

  const stablo: KategorijaCvor[] = sve
    .filter((k) => k.parent_id == null)
    .map((roditelj) => {
      const djeca = (djecaPoRoditelju.get(roditelj.id) ?? [])
        .map((c) => ({
          id: c.id,
          naziv: c.naziv,
          slug: c.slug ?? String(c.id),
          brojUsluga: brojPoKategoriji.get(c.id) ?? 0,
        }))
        .sort((a, b) => b.brojUsluga - a.brojUsluga || poNazivu(a, b));

      const direktno = brojPoKategoriji.get(roditelj.id) ?? 0;
      const ukupno = direktno + djeca.reduce((s, c) => s + c.brojUsluga, 0);

      return {
        id: roditelj.id,
        naziv: roditelj.naziv,
        slug: roditelj.slug ?? String(roditelj.id),
        brojUsluga: direktno,
        ukupnoUsluga: ukupno,
        djeca,
      };
    });

  stablo.sort((a, b) => b.ukupnoUsluga - a.ukupnoUsluga || poNazivu(a, b));
  return stablo;
}

function promoRank(promocija: UslugaListItem["promocija"]): number {
  if (promocija === "izdvojeno+") return 0;
  if (promocija === "izdvojeno") return 1;
  return 2;
}

function normalizeTekst(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type SearchParams = {
  q?: string;
  kategorija?: string;
  drzava?: string;
  grad?: string;
  tip?: string;
  valuta?: string;
  cijenaMin?: number;
  cijenaMax?: number;
  ocjena?: number;
  sort?: UslugaSortKey;
  page?: number;
};

type ObogacenaUsluga = {
  item: UslugaListItem;
  kategorijaId: number | null;
  drzave: string[];
  gradovi: string[];
  cijenaBAM: number | null;
  ocjena: number;
};

export async function searchUsluge(
  params: SearchParams,
): Promise<PretragaRezultat> {
  const supabase = await createClient();
  const sort = params.sort ?? DEFAULT_SORT;
  const trazeniPojamNorm = normalizeTekst(params.q?.trim() ?? "");

  // ── Kategorije: hijerarhija za filter i facete ──
  const { data: katsData, error: katsError } = await supabase
    .from("kategorije")
    .select("id, naziv, slug, parent_id");
  if (katsError) throw katsError;

  const kategorije = (katsData ?? []) as {
    id: number;
    naziv: string;
    slug: string | null;
    parent_id: number | null;
  }[];

  const katById = new Map(kategorije.map((k) => [k.id, k]));
  const djecaPoRoditelju = new Map<number, number[]>();
  for (const k of kategorije) {
    if (k.parent_id == null) continue;
    const arr = djecaPoRoditelju.get(k.parent_id) ?? [];
    arr.push(k.id);
    djecaPoRoditelju.set(k.parent_id, arr);
  }

  const potomci = (rootId: number): Set<number> => {
    const ids = new Set<number>([rootId]);
    let granica = [rootId];
    while (granica.length) {
      const sljedeca: number[] = [];
      for (const id of granica) {
        for (const childId of djecaPoRoditelju.get(id) ?? []) {
          if (!ids.has(childId)) {
            ids.add(childId);
            sljedeca.push(childId);
          }
        }
      }
      granica = sljedeca;
    }
    return ids;
  };

  let kategorijaInfo: { naziv: string; slug: string } | null = null;
  let kategorijaFilterIds: Set<number> | null = null;
  if (params.kategorija) {
    const cilj = kategorije.find((k) => k.slug === params.kategorija);
    if (cilj) {
      kategorijaInfo = { naziv: cilj.naziv, slug: cilj.slug ?? params.kategorija };
      kategorijaFilterIds = potomci(cilj.id);
    } else {
      kategorijaFilterIds = new Set([-1]);
    }
  }

  // ── Sve aktivne usluge (filtriranje i faceti idu in-memory) ──
  const kolone = (saPromocijom: boolean) => `
      id,
      naziv,
      informacije,
      tip,
      ${saPromocijom ? "promocija, promovisano_do," : ""}
      status,
      expires_at,
      created_at,
      cijena,
      tip_cijene,
      valuta,
      kategorija_id,
      mjesta_rada,
      slike ( id, slika_url, sort_order )
    `;

  const buildQuery = (saPromocijom: boolean) =>
    supabase
      .from("usluge")
      .select(kolone(saPromocijom))
      .eq("status", "aktivno")
      .limit(2000);

  let { data, error } = await buildQuery(true);
  if (error?.message.includes("promocija")) {
    const fallback = await buildQuery(false);
    data = fallback.data;
    error = fallback.error;
  }
  if (error) throw error;

  const rows = (data ?? []) as unknown as UslugaWithRelations[];
  const aktivne = rows.filter(isUslugaActive);
  const stats = await fetchReviewStats(aktivne.map((u) => u.id));

  const gradUDrzavi = new Map<string, string>();
  for (const [drzava, gradovi] of Object.entries(GRADOVI_PO_DRZAVI)) {
    for (const grad of gradovi) gradUDrzavi.set(grad, drzava);
  }

  const obogacene: ObogacenaUsluga[] = aktivne.map((row) => {
    const cijena = row.cijena != null ? Number(row.cijena) : null;
    const mjesta = parseMjestaRada(
      row.mjesta_rada as Parameters<typeof parseMjestaRada>[0],
    );
    const drzaveSet = new Set<string>(mjesta.drzave);
    for (const g of mjesta.gradovi) {
      const d = gradUDrzavi.get(g);
      if (d) drzaveSet.add(d);
    }
    const ocjena = getReviewAverage(stats, row.id);
    return {
      item: {
        id: row.id,
        naziv: row.naziv,
        informacije: truncateText(row.informacije),
        promocija: normalizePromocija(row.promocija, row.tip, row.promovisano_do),
        created_at: row.created_at,
        slikaUrl: pickCoverImage(row.slike),
        prosecnaOcjena: ocjena,
        brojRecenzija: getReviewCount(stats, row.id),
        cijena,
        tip_cijene: row.tip_cijene ?? null,
        valuta: row.valuta ?? null,
      },
      kategorijaId: row.kategorija_id ?? null,
      drzave: [...drzaveSet],
      gradovi: mjesta.gradovi,
      cijenaBAM: cijenaUBAM(cijena, row.valuta),
      ocjena,
    };
  });

  // ── Predikati za pojedinačne filtere ──
  const valutaFiltera = params.valuta ?? DEFAULT_VALUTA;
  const kursFiltera = KURS_U_BAM[valutaFiltera] ?? 1;
  const minBAM = params.cijenaMin != null ? params.cijenaMin * kursFiltera : null;
  const maxBAM = params.cijenaMax != null ? params.cijenaMax * kursFiltera : null;

  const matchQ = (e: ObogacenaUsluga) =>
    !trazeniPojamNorm || normalizeTekst(e.item.naziv).includes(trazeniPojamNorm);
  const matchKategorija = (e: ObogacenaUsluga) =>
    !kategorijaFilterIds ||
    (e.kategorijaId != null && kategorijaFilterIds.has(e.kategorijaId));
  const matchDrzava = (e: ObogacenaUsluga) =>
    !params.drzava || e.drzave.includes(params.drzava);
  const matchGrad = (e: ObogacenaUsluga) => {
    if (!params.grad) return true;
    if (e.gradovi.includes(params.grad)) return true;
    const d = gradUDrzavi.get(params.grad);
    return d != null && e.drzave.includes(d);
  };
  const matchTip = (e: ObogacenaUsluga) =>
    !params.tip || e.item.tip_cijene === params.tip;
  const matchCijena = (e: ObogacenaUsluga) => {
    if (!params.tip) return true; // raspon ima smisla tek uz izabran tip cijene
    if (minBAM == null && maxBAM == null) return true;
    if (e.cijenaBAM == null) return false;
    if (minBAM != null && e.cijenaBAM < minBAM) return false;
    if (maxBAM != null && e.cijenaBAM > maxBAM) return false;
    return true;
  };
  const matchOcjena = (e: ObogacenaUsluga) =>
    params.ocjena == null || e.ocjena >= params.ocjena;

  type Dim = "q" | "kategorija" | "lokacija" | "tip" | "cijena" | "ocjena";
  const prolazi = (e: ObogacenaUsluga, izuzmi?: Set<Dim>): boolean => {
    if (!izuzmi?.has("q") && !matchQ(e)) return false;
    if (!izuzmi?.has("kategorija") && !matchKategorija(e)) return false;
    if (!izuzmi?.has("lokacija") && (!matchDrzava(e) || !matchGrad(e))) return false;
    if (!izuzmi?.has("tip") && !matchTip(e)) return false;
    if (!izuzmi?.has("cijena") && !matchCijena(e)) return false;
    if (!izuzmi?.has("ocjena") && !matchOcjena(e)) return false;
    return true;
  };

  // ── Faceti (brojevi rezultata uz svaku opciju) ──
  const zaLokaciju = obogacene.filter((e) => prolazi(e, new Set(["lokacija"])));
  const drzaveFacet = DRZAVE.map((d) => ({
    value: d as string,
    count: zaLokaciju.filter((e) => e.drzave.includes(d)).length,
  })).filter((f) => f.count > 0 || f.value === params.drzava);

  const gradBroj = new Map<string, number>();
  for (const e of zaLokaciju) {
    for (const g of e.gradovi) gradBroj.set(g, (gradBroj.get(g) ?? 0) + 1);
  }
  const gradoviFacet = params.drzava
    ? (GRADOVI_PO_DRZAVI[params.drzava as keyof typeof GRADOVI_PO_DRZAVI] ?? [])
        .map((g) => ({ value: g, count: gradBroj.get(g) ?? 0 }))
        .filter((f) => f.count > 0 || f.value === params.grad)
    : [];

  const zaKategoriju = obogacene.filter((e) => prolazi(e, new Set(["kategorija"])));
  const direktanKatBroj = new Map<number, number>();
  for (const e of zaKategoriju) {
    if (e.kategorijaId == null) continue;
    direktanKatBroj.set(
      e.kategorijaId,
      (direktanKatBroj.get(e.kategorijaId) ?? 0) + 1,
    );
  }
  const kategorijeFacet = kategorije
    .map((k) => {
      let count = 0;
      for (const id of potomci(k.id)) count += direktanKatBroj.get(id) ?? 0;
      return {
        slug: k.slug ?? String(k.id),
        naziv: k.naziv,
        parentNaziv:
          k.parent_id != null ? katById.get(k.parent_id)?.naziv ?? null : null,
        count,
      };
    })
    .sort(
      (a, b) =>
        (a.parentNaziv ?? a.naziv).localeCompare(b.parentNaziv ?? b.naziv, "sr") ||
        (a.parentNaziv ? 1 : 0) - (b.parentNaziv ? 1 : 0) ||
        a.naziv.localeCompare(b.naziv, "sr"),
    );

  const zaTip = obogacene.filter((e) => prolazi(e, new Set(["tip", "cijena"])));
  const tipoviFacet = TIP_CIJENE_OPTIONS.map((t) => ({
    value: t as string,
    count: zaTip.filter((e) => e.item.tip_cijene === t).length,
  })).filter((f) => f.count > 0 || f.value === params.tip);

  const zaOcjenu = obogacene.filter((e) => prolazi(e, new Set(["ocjena"])));
  const ocjeneFacet = MIN_OCJENA_OPCIJE.map((o) => ({
    value: o as number,
    count: zaOcjenu.filter((e) => e.ocjena >= o).length,
  }));

  const facets: PretragaFacets = {
    drzave: drzaveFacet,
    gradovi: gradoviFacet,
    kategorije: kategorijeFacet,
    tipovi: tipoviFacet,
    ocjene: ocjeneFacet,
  };

  // ── Konačni rezultat: filtriranje, sortiranje, paginacija ──
  const filtrirane = obogacene.filter((e) => prolazi(e));

  const cijenaZaSort = (e: ObogacenaUsluga): number | null =>
    e.item.tip_cijene === "dogovor" ? null : e.cijenaBAM;

  filtrirane.sort((a, b) => {
    const pr = promoRank(a.item.promocija) - promoRank(b.item.promocija);
    if (pr !== 0) return pr;

    switch (sort) {
      case "ocjena_desc":
        return (
          b.item.prosecnaOcjena - a.item.prosecnaOcjena ||
          b.item.brojRecenzija - a.item.brojRecenzija
        );
      case "ocjena_asc":
        return (
          a.item.prosecnaOcjena - b.item.prosecnaOcjena ||
          a.item.brojRecenzija - b.item.brojRecenzija
        );
      case "cijena_asc":
      case "cijena_desc": {
        const ax = cijenaZaSort(a);
        const bx = cijenaZaSort(b);
        if (ax == null && bx == null) return 0;
        if (ax == null) return 1; // "po dogovoru" / bez cijene uvijek na dno
        if (bx == null) return -1;
        return sort === "cijena_asc" ? ax - bx : bx - ax;
      }
      case "datum_asc":
        return (
          new Date(a.item.created_at).getTime() -
          new Date(b.item.created_at).getTime()
        );
      case "datum_desc":
        return (
          new Date(b.item.created_at).getTime() -
          new Date(a.item.created_at).getTime()
        );
      case "preporuceno":
      default:
        return (
          b.item.prosecnaOcjena - a.item.prosecnaOcjena ||
          b.item.brojRecenzija - a.item.brojRecenzija ||
          new Date(b.item.created_at).getTime() -
            new Date(a.item.created_at).getTime()
        );
    }
  });

  const total = filtrirane.length;
  const totalPages = Math.max(1, Math.ceil(total / PRETRAGA_PER_PAGE));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);
  const start = (page - 1) * PRETRAGA_PER_PAGE;
  const items = filtrirane
    .slice(start, start + PRETRAGA_PER_PAGE)
    .map((e) => e.item);

  return { items, total, page, totalPages, kategorija: kategorijaInfo, facets };
}

export async function fetchRecenzijeZaUslugu(
  uslugaId: number,
): Promise<RecenzijaItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recenzije")
    .select(
      `
      id,
      parent_id,
      ocjena,
      komentar,
      slika,
      created_at,
      ocjenjivac:ocjenjivac_id (
        id,
        ime,
        prezime,
        korisnicko_ime,
        profilna_slika
      )
    `,
    )
    .eq("usluga_id", uslugaId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as {
    id: number;
    parent_id: number | null;
    ocjena: number | null;
    komentar: string | null;
    slika: string | null;
    created_at: string;
    ocjenjivac: RecenzijaItem["ocjenjivac"] | null;
  }[];

  const validni = rows.filter((r) => r.ocjenjivac != null);

  const odgovoriPoRoditelju = new Map<number, OdgovorItem[]>();
  for (const r of validni) {
    if (r.parent_id == null || !r.komentar) continue;
    const lista = odgovoriPoRoditelju.get(r.parent_id) ?? [];
    lista.push({
      id: r.id,
      komentar: r.komentar,
      created_at: r.created_at,
      ocjenjivac: r.ocjenjivac as RecenzijaItem["ocjenjivac"],
    });
    odgovoriPoRoditelju.set(r.parent_id, lista);
  }

  return validni
    .filter((r) => r.parent_id == null && r.ocjena != null)
    .map((r) => ({
      id: r.id,
      ocjena: r.ocjena as number,
      komentar: r.komentar,
      slika: r.slika,
      created_at: r.created_at,
      ocjenjivac: r.ocjenjivac as RecenzijaItem["ocjenjivac"],
      odgovori: (odgovoriPoRoditelju.get(r.id) ?? []).sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    }));
}

export async function fetchKorisnikReviewStats(
  korisnikId: number,
): Promise<KorisnikReviewStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recenzije")
    .select("ocjena")
    .eq("ocjenjen_id", korisnikId)
    .is("parent_id", null)
    .not("ocjena", "is", null);

  if (error) throw error;

  const ocjene = (data ?? [])
    .map((r) => (r as { ocjena: number | null }).ocjena)
    .filter((o): o is number => o != null);

  if (ocjene.length === 0) {
    return { prosecnaOcjena: 0, brojRecenzija: 0 };
  }

  const sum = ocjene.reduce((acc, o) => acc + o, 0);
  return {
    prosecnaOcjena: Math.round((sum / ocjene.length) * 10) / 10,
    brojRecenzija: ocjene.length,
  };
}
