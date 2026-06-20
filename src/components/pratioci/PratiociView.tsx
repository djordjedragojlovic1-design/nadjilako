"use client";

import { useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PratiociKorisnik } from "@/lib/pratioci/types";

type PratiociViewProps = {
  pratioci: PratiociKorisnik[];
  praceni: PratiociKorisnik[];
};

type Tab = "pratioci" | "pratim";

function initials(ime: string, prezime: string): string {
  return `${ime.charAt(0)}${prezime.charAt(0)}`.toUpperCase();
}

function KorisnikRedak({ korisnik }: { korisnik: PratiociKorisnik }) {
  return (
    <AppLink
      href={`/profil/${korisnik.id}`}
      className="flex items-center gap-3 rounded-lg border p-3 text-inherit no-underline transition-colors hover:bg-muted"
    >
      <Avatar className="size-11 shrink-0">
        {korisnik.profilna_slika ? (
          <AvatarImage src={korisnik.profilna_slika} alt="" />
        ) : null}
        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
          {initials(korisnik.ime, korisnik.prezime)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-semibold">
          {korisnik.ime} {korisnik.prezime}
        </p>
        <p className="text-muted-foreground truncate text-sm">
          @{korisnik.korisnicko_ime}
        </p>
      </div>
    </AppLink>
  );
}

function Lista({
  korisnici,
  prazno,
}: {
  korisnici: PratiociKorisnik[];
  prazno: string;
}) {
  if (korisnici.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed px-8 py-12 text-center">
        {prazno}
      </p>
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {korisnici.map((k) => (
        <KorisnikRedak key={k.id} korisnik={k} />
      ))}
    </div>
  );
}

export function PratiociView({ pratioci, praceni }: PratiociViewProps) {
  const [tab, setTab] = useState<Tab>("pratioci");

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
      <TabsList
        variant="line"
        className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0"
      >
        <TabsTrigger value="pratioci" className="rounded-none px-4 py-3">
          Pratioci ({pratioci.length})
        </TabsTrigger>
        <TabsTrigger value="pratim" className="rounded-none px-4 py-3">
          Pratim ({praceni.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pratioci" className="pt-6">
        <Lista korisnici={pratioci} prazno="Još vas niko ne prati." />
      </TabsContent>

      <TabsContent value="pratim" className="pt-6">
        <Lista
          korisnici={praceni}
          prazno="Još ne pratite nijedan nalog."
        />
      </TabsContent>
    </Tabs>
  );
}
