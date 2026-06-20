"use client";

import { useMemo, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { KategorijaFacet } from "@/lib/usluge/types";

type KategorijaSelectProps = {
  kategorije: KategorijaFacet[];
  value: string | null;
  onChange: (slug: string | null) => void;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function KategorijaSelect({
  kategorije,
  value,
  onChange,
}: KategorijaSelectProps) {
  const [open, setOpen] = useState(false);
  const [pretraga, setPretraga] = useState("");

  const izabrana = value
    ? (kategorije.find((k) => k.slug === value)?.naziv ?? "Kategorija")
    : null;

  const filtrirane = useMemo(() => {
    const q = normalize(pretraga.trim());
    if (!q) return kategorije;
    return kategorije.filter((k) => normalize(k.naziv).includes(q));
  }, [pretraga, kategorije]);

  const izaberi = (slug: string | null) => {
    onChange(slug);
    setOpen(false);
    setPretraga("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          />
        }
      >
        <span
          className={cn(
            "truncate",
            izabrana ? "font-semibold" : "text-muted-foreground",
          )}
        >
          {izabrana ?? "Sve kategorije"}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Pretraži kategorije..."
            value={pretraga}
            onValueChange={setPretraga}
          />
          <CommandList className="max-h-72">
            <CommandEmpty>Nema rezultata</CommandEmpty>
            <CommandItem
              value="__all__"
              data-checked={value === null}
              onSelect={() => izaberi(null)}
            >
              Sve kategorije
            </CommandItem>
            {filtrirane.map((k) => (
              <CommandItem
                key={k.slug}
                value={k.slug}
                data-checked={k.slug === value}
                className={cn(
                  "justify-between",
                  k.parentNaziv ? "pl-6" : "font-bold",
                )}
                onSelect={() => izaberi(k.slug)}
              >
                <span className="min-w-0 truncate">{k.naziv}</span>
                <span className="text-muted-foreground shrink-0 text-xs font-semibold">
                  {k.count}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
