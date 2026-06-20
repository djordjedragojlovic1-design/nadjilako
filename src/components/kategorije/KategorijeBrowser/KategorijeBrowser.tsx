"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import { AppLink } from "@/components/ui/AppLink";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import type { KategorijaCvor } from "@/lib/usluge/types";

type KategorijeBrowserProps = {
  stablo: KategorijaCvor[];
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function brojLabela(broj: number): string {
  return broj === 1 ? "1 usluga" : `${broj} usluga`;
}

export function KategorijeBrowser({ stablo }: KategorijeBrowserProps) {
  const [upit, setUpit] = useState("");

  const filtrirano = useMemo(() => {
    const q = normalize(upit.trim());
    if (!q) return stablo;

    return stablo
      .map((parent) => {
        const parentMatch = normalize(parent.naziv).includes(q);
        if (parentMatch) return parent;

        const djeca = parent.djeca.filter((dijete) =>
          normalize(dijete.naziv).includes(q),
        );
        if (djeca.length) return { ...parent, djeca };

        return null;
      })
      .filter((parent): parent is KategorijaCvor => parent !== null);
  }, [upit, stablo]);

  return (
    <div className="flex flex-col gap-8">
      <InputGroup className="max-w-lg rounded-full">
        <InputGroupAddon>
          <SearchIcon className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder="Pretraži kategorije..."
          aria-label="Pretraži kategorije"
          value={upit}
          onChange={(e) => setUpit(e.target.value)}
        />
      </InputGroup>

      {filtrirano.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-12 text-center">
          Nema kategorija koje odgovaraju pojmu &bdquo;{upit.trim()}&ldquo;.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] items-start gap-6">
          {filtrirano.map((parent) => (
            <Card key={parent.id} className="overflow-hidden py-0">
              <AppLink
                href={`/pretraga?kategorija=${parent.slug}`}
                className="bg-muted/50 hover:[&_span:first-child]:text-primary flex items-baseline justify-between gap-2 border-b px-4 py-4 transition-colors"
              >
                <span className="text-base font-bold">{parent.naziv}</span>
                <span className="text-muted-foreground shrink-0 text-xs font-semibold">
                  {brojLabela(parent.ukupnoUsluga)}
                </span>
              </AppLink>

              {parent.djeca.length > 0 && (
                <CardContent className="flex flex-col px-0 py-1">
                  <ul>
                    {parent.djeca.map((dijete) => (
                      <li key={dijete.id}>
                        <AppLink
                          href={`/pretraga?kategorija=${dijete.slug}`}
                          className={cn(
                            "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                            "flex items-center justify-between gap-2 py-2 pr-4 pl-8 text-[0.9375rem] transition-colors",
                          )}
                        >
                          <span className="min-w-0">{dijete.naziv}</span>
                          <span className="text-muted-foreground shrink-0 text-[0.8125rem] font-semibold">
                            {dijete.brojUsluga}
                          </span>
                        </AppLink>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
