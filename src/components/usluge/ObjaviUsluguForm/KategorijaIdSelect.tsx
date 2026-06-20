"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDownIcon } from "lucide-react";
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

export type KategorijaStavka = {
  id: number;
  naziv: string;
  parentNaziv?: string | null;
};

type KategorijaIdSelectProps = {
  kategorije: KategorijaStavka[];
  value: number | null;
  onChange: (id: number | null) => void;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function KategorijaIdSelect({
  kategorije,
  value,
  onChange,
}: KategorijaIdSelectProps) {
  const [open, setOpen] = useState(false);
  const [pretraga, setPretraga] = useState("");

  const izabrana =
    value != null ? kategorije.find((k) => k.id === value)?.naziv ?? null : null;

  const filtrirane = useMemo(() => {
    const q = normalize(pretraga.trim());
    if (!q) return kategorije;
    return kategorije.filter((k) => normalize(k.naziv).includes(q));
  }, [pretraga, kategorije]);

  const izaberi = (id: number | null) => {
    onChange(id);
    setOpen(false);
    setPretraga("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none hover:bg-muted/50 dark:bg-input/30",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn("truncate", !izabrana && "text-muted-foreground")}>
          {izabrana ?? "Bez kategorije"}
        </span>
        <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Pretraži kategorije..."
            value={pretraga}
            onValueChange={setPretraga}
          />
          <CommandList>
            <CommandEmpty>Nema rezultata</CommandEmpty>
            <CommandItem
              value="bez-kategorije"
              data-checked={value === null}
              onSelect={() => izaberi(null)}
            >
              Bez kategorije
            </CommandItem>
            {filtrirane.map((k) => (
              <CommandItem
                key={k.id}
                value={String(k.id)}
                data-checked={k.id === value}
                className={cn(k.parentNaziv ? "pl-6" : "font-bold")}
                onSelect={() => izaberi(k.id)}
              >
                {k.naziv}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
