"use client";

import { useMemo, useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatKratkoVrijeme, getInitials } from "@/lib/chat/format";
import type { RazgovorListItem } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

type RazgovorListaProps = {
  razgovori: RazgovorListItem[];
  activeChatId: number | null;
};

function preview(r: RazgovorListItem): string {
  if (!r.poslednjaPoruka) return "Nema poruka";
  const prefix = r.poslednjaPoruka.odMene ? "Vi: " : "";
  if (r.poslednjaPoruka.tekst) return `${prefix}${r.poslednjaPoruka.tekst}`;
  if (r.poslednjaPoruka.imaSliku) return `${prefix}📷 Slika`;
  return "Nema poruka";
}

export function RazgovorLista({ razgovori, activeChatId }: RazgovorListaProps) {
  const [q, setQ] = useState("");

  const filtrirani = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return razgovori;
    return razgovori.filter((r) => {
      const ime = `${r.drugiUcesnik.ime} ${r.drugiUcesnik.prezime}`.toLowerCase();
      const username = r.drugiUcesnik.korisnicko_ime.toLowerCase();
      const usluga = r.usluga?.naziv.toLowerCase() ?? "";
      return (
        ime.includes(term) || username.includes(term) || usluga.includes(term)
      );
    });
  }, [q, razgovori]);

  return (
    <>
      <div className="border-b p-4">
        <h1 className="mb-2 text-lg font-bold">Poruke</h1>
        <Input
          type="search"
          placeholder="Pretraži razgovore..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Pretraga razgovora"
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {filtrirani.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {razgovori.length === 0
              ? "Još nemate nijedan razgovor."
              : "Nema rezultata pretrage."}
          </p>
        ) : (
          filtrirani.map((r) => {
            const ucesnik = r.drugiUcesnik;
            const prikaznoIme = `@${ucesnik.korisnicko_ime}`;
            const nepr = r.brojNeprocitanih > 0;
            return (
              <AppLink
                key={r.id}
                href={`/chat/${r.id}`}
                className={cn(
                  "flex w-full items-center gap-4 border-b p-4 text-left transition-colors hover:bg-muted/50",
                  r.id === activeChatId && "bg-primary/10 hover:bg-primary/10",
                )}
              >
                <Avatar className="size-11 shrink-0">
                  {ucesnik.profilna_slika ? (
                    <AvatarImage src={ucesnik.profilna_slika} alt="" />
                  ) : null}
                  <AvatarFallback className="font-semibold">
                    {getInitials(ucesnik.ime, ucesnik.prezime)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      {prikaznoIme}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatKratkoVrijeme(r.lastMessageAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-sm text-muted-foreground",
                        nepr && "font-semibold text-foreground",
                      )}
                    >
                      {preview(r)}
                    </span>
                    {nepr && (
                      <Badge className="size-5 min-w-5 shrink-0 justify-center rounded-full px-1.5 text-[0.7rem]">
                        {r.brojNeprocitanih}
                      </Badge>
                    )}
                  </span>
                  {r.usluga && (
                    <span className="mt-0.5 block truncate text-xs text-primary">
                      {r.usluga.naziv}
                    </span>
                  )}
                </span>
              </AppLink>
            );
          })
        )}
      </ScrollArea>
    </>
  );
}
