"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { GRADOVI_PO_DRZAVI } from "@/lib/lokacije/gradovi";
import {
  DEFAULT_VALUTA,
  TIP_CIJENE_LABELS,
  VALUTA_LABELS,
  VALUTA_OPTIONS,
} from "@/lib/usluge/constants";
import type {
  PretragaFacets,
  PretragaFilteriValues,
} from "@/lib/usluge/types";
import { KategorijaSelect } from "./KategorijaSelect";

const ALL = "__all__";

function drzavaLabel(drzava: string, facets: PretragaFacets) {
  if (!drzava) return "Sve države";
  const item = facets.drzave.find((d) => d.value === drzava);
  return item ? `${item.value} (${item.count})` : drzava;
}

function gradLabel(
  grad: string,
  drzava: string,
  gradBroj: Map<string, number>,
) {
  if (!drzava) return "Prvo izaberi državu";
  if (!grad) return "Svi gradovi";
  const broj = gradBroj.get(grad);
  return broj != null ? `${grad} (${broj})` : grad;
}

function tipLabel(tip: string, facets: PretragaFacets) {
  if (!tip) return "Svi tipovi";
  const item = facets.tipovi.find((t) => t.value === tip);
  const naziv = TIP_CIJENE_LABELS[tip] ?? tip;
  return item ? `${naziv} (${item.count})` : naziv;
}

type PretragaFilteriProps = {
  filteri: PretragaFilteriValues;
  facets: PretragaFacets;
};

type FilterFormProps = {
  facets: PretragaFacets;
  drzava: string;
  setDrzava: (value: string) => void;
  grad: string;
  setGrad: (value: string) => void;
  kategorija: string | null;
  setKategorija: (value: string | null) => void;
  tip: string;
  setTip: (value: string) => void;
  valuta: string;
  setValuta: (value: string) => void;
  cijenaMin: string;
  setCijenaMin: (value: string) => void;
  cijenaMax: string;
  setCijenaMax: (value: string) => void;
  ocjena: number | null;
  setOcjena: (value: number | null) => void;
  gradBroj: Map<string, number>;
  gradoviZaDrzavu: readonly string[];
};

function setOrDelete(
  params: URLSearchParams,
  key: string,
  value: string | number | null | undefined,
) {
  if (value === null || value === undefined || value === "") {
    params.delete(key);
  } else {
    params.set(key, String(value));
  }
}

function FilterForm({
  facets,
  drzava,
  setDrzava,
  grad,
  setGrad,
  kategorija,
  setKategorija,
  tip,
  setTip,
  valuta,
  setValuta,
  cijenaMin,
  setCijenaMin,
  cijenaMax,
  setCijenaMax,
  ocjena,
  setOcjena,
  gradBroj,
  gradoviZaDrzavu,
}: FilterFormProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="f-drzava" className="text-muted-foreground text-xs font-semibold">
          Država
        </Label>
        <Select
          value={drzava || ALL}
          onValueChange={(v) => {
            setDrzava(!v || v === ALL ? "" : v);
            setGrad("");
          }}
        >
          <SelectTrigger id="f-drzava" className="w-full">
            <SelectValue>{drzavaLabel(drzava, facets)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Sve države</SelectItem>
            {facets.drzave.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.value} ({d.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="f-grad" className="text-muted-foreground text-xs font-semibold">
          Grad
        </Label>
        <Select
          value={grad || ALL}
          onValueChange={(v) => setGrad(!v || v === ALL ? "" : v)}
          disabled={!drzava}
        >
          <SelectTrigger id="f-grad" className="w-full">
            <SelectValue>{gradLabel(grad, drzava, gradBroj)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>
              {drzava ? "Svi gradovi" : "Prvo izaberi državu"}
            </SelectItem>
            {gradoviZaDrzavu.map((g) => {
              const broj = gradBroj.get(g);
              return (
                <SelectItem key={g} value={g}>
                  {broj != null ? `${g} (${broj})` : g}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs font-semibold">
          Kategorija
        </Label>
        <KategorijaSelect
          kategorije={facets.kategorije}
          value={kategorija}
          onChange={setKategorija}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="f-tip" className="text-muted-foreground text-xs font-semibold">
          Tip cijene
        </Label>
        <Select
          value={tip || ALL}
          onValueChange={(v) => setTip(!v || v === ALL ? "" : v)}
        >
          <SelectTrigger id="f-tip" className="w-full">
            <SelectValue>{tipLabel(tip, facets)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Svi tipovi</SelectItem>
            {facets.tipovi.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {(TIP_CIJENE_LABELS[t.value] ?? t.value)} ({t.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tip ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-valuta" className="text-muted-foreground text-xs font-semibold">
            Valuta (samo radi lakšeg unosa)
          </Label>
          <Select
            value={valuta}
            onValueChange={(v) => {
              if (v) setValuta(v);
            }}
          >
            <SelectTrigger id="f-valuta" className="w-full">
              <SelectValue>{VALUTA_LABELS[valuta as keyof typeof VALUTA_LABELS] ?? valuta}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {VALUTA_OPTIONS.map((v) => (
                <SelectItem key={v} value={v}>
                  {VALUTA_LABELS[v] ?? v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label className="text-muted-foreground mt-3 text-xs font-semibold">
            Raspon cijene
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Od"
              value={cijenaMin}
              onChange={(e) => setCijenaMin(e.target.value)}
              aria-label="Cijena od"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Do"
              value={cijenaMax}
              onChange={(e) => setCijenaMax(e.target.value)}
              aria-label="Cijena do"
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Prikazuju se i usluge u drugim valutama (preračun u pozadini).
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs font-semibold">
          Minimalna ocjena
        </Label>
        <div className="flex gap-1">
          {[...facets.ocjene]
            .sort((a, b) => a.value - b.value)
            .map((o) => (
              <Button
                key={o.value}
                type="button"
                variant={ocjena === o.value ? "default" : "outline"}
                size="sm"
                className="h-auto flex-1 px-1 py-2 text-xs"
                onClick={() =>
                  setOcjena(ocjena === o.value ? null : o.value)
                }
              >
                {o.value}+{" "}
                <span className="font-normal opacity-80">({o.count})</span>
              </Button>
            ))}
        </div>
      </div>
    </>
  );
}

function FilterActions({
  onApply,
  onReset,
}: {
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={onApply}>
        Primijeni
      </Button>
      <Button type="button" variant="outline" onClick={onReset}>
        Poništi filtere
      </Button>
    </div>
  );
}

export function PretragaFilteri({ filteri, facets }: PretragaFilteriProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [drzava, setDrzava] = useState(filteri.drzava ?? "");
  const [grad, setGrad] = useState(filteri.grad ?? "");
  const [kategorija, setKategorija] = useState<string | null>(filteri.kategorija);
  const [tip, setTip] = useState(filteri.tip ?? "");
  const [valuta, setValuta] = useState(filteri.valuta || DEFAULT_VALUTA);
  const [cijenaMin, setCijenaMin] = useState(
    filteri.cijenaMin != null ? String(filteri.cijenaMin) : "",
  );
  const [cijenaMax, setCijenaMax] = useState(
    filteri.cijenaMax != null ? String(filteri.cijenaMax) : "",
  );
  const [ocjena, setOcjena] = useState<number | null>(filteri.ocjena);

  const gradBroj = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of facets.gradovi) m.set(g.value, g.count);
    return m;
  }, [facets.gradovi]);

  const gradoviZaDrzavu = drzava
    ? (GRADOVI_PO_DRZAVI[drzava as keyof typeof GRADOVI_PO_DRZAVI] ?? [])
    : [];

  const formProps: FilterFormProps = {
    facets,
    drzava,
    setDrzava,
    grad,
    setGrad,
    kategorija,
    setKategorija,
    tip,
    setTip,
    valuta,
    setValuta,
    cijenaMin,
    setCijenaMin,
    cijenaMax,
    setCijenaMax,
    ocjena,
    setOcjena,
    gradBroj,
    gradoviZaDrzavu,
  };

  const primijeni = () => {
    const params = new URLSearchParams(searchParams.toString());
    setOrDelete(params, "kategorija", kategorija);
    setOrDelete(params, "drzava", drzava);
    setOrDelete(params, "grad", drzava ? grad : null);
    setOrDelete(params, "tip", tip);
    if (tip) {
      setOrDelete(params, "valuta", valuta !== DEFAULT_VALUTA ? valuta : null);
      setOrDelete(params, "cijena_min", cijenaMin);
      setOrDelete(params, "cijena_max", cijenaMax);
    } else {
      params.delete("valuta");
      params.delete("cijena_min");
      params.delete("cijena_max");
    }
    setOrDelete(params, "ocjena", ocjena);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  };

  const ponisti = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const k of [
      "kategorija",
      "drzava",
      "grad",
      "tip",
      "valuta",
      "cijena_min",
      "cijena_max",
      "ocjena",
      "page",
    ]) {
      params.delete(k);
    }
    setDrzava("");
    setGrad("");
    setKategorija(null);
    setTip("");
    setValuta(DEFAULT_VALUTA);
    setCijenaMin("");
    setCijenaMax("");
    setOcjena(null);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className="hidden w-full max-[880px]:flex"
        onClick={() => setOpen(true)}
      >
        Filteri
      </Button>

      <Card
        className={cn(
          "sticky top-[calc(var(--navbar-height)+1rem)] hidden min-[881px]:block",
        )}
      >
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Filteri</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-4">
          <FilterForm {...formProps} />
          <FilterActions onApply={primijeni} onReset={ponisti} />
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-[min(20rem,85vw)] overflow-y-auto sm:max-w-xs"
        >
          <SheetHeader>
            <SheetTitle>Filteri</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-6 px-4 pb-4">
            <FilterForm {...formProps} />
            <FilterActions onApply={primijeni} onReset={ponisti} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
