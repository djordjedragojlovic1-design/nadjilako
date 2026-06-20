"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { kupiKrediteClient } from "@/lib/krediti/client";
import {
  KREDIT_PAKETI,
  KREDIT_TIP_LABELS,
  PROMO_CIJENE,
} from "@/lib/krediti/constants";
import type { KreditTransakcija } from "@/types/database";
import { cn } from "@/lib/utils";

type KreditiViewProps = {
  stanje: number;
  transakcije: KreditTransakcija[];
};

function formatDatum(iso: string): string {
  return new Intl.DateTimeFormat("sr-Latn-BA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function KreditiView({ stanje, transakcije }: KreditiViewProps) {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [kupujem, setKupujem] = useState<number | null>(null);
  const [poruka, setPoruka] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);

  async function kupi(iznos: number) {
    setKupujem(iznos);
    setPoruka(null);
    setGreska(null);

    const { error, saldo } = await kupiKrediteClient(iznos);

    if (error) {
      setGreska(error);
      setKupujem(null);
      return;
    }

    await refreshProfile();
    router.refresh();
    setPoruka(
      `Uspješno ste dodali ${iznos} kredita. Novo stanje: ${saldo ?? stanje + iznos} kredita.`,
    );
    setKupujem(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <Card className="border-0 bg-primary text-primary-foreground shadow-lg">
        <CardContent className="flex flex-col gap-2 p-8">
          <span className="text-xs font-semibold tracking-widest uppercase opacity-85">
            Trenutno stanje
          </span>
          <span className="flex items-baseline gap-2 text-4xl font-extrabold leading-none md:text-5xl">
            {stanje}
            <span className="text-base font-semibold opacity-90">kredita</span>
          </span>
          <p className="mt-1 text-sm opacity-90">
            Promocija „Izdvojeno&quot; košta {PROMO_CIJENE.izdvojeno} kredita, a
            „Izdvojeno+&quot; {PROMO_CIJENE["izdvojeno+"]} kredita (po 30 dana).
          </p>
        </CardContent>
      </Card>

      {greska && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{greska}</AlertDescription>
        </Alert>
      )}
      {poruka && (
        <Alert
          className="border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          role="status"
        >
          <AlertDescription>{poruka}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-sm">
        <CardContent className="p-8">
          <h2 className="text-xl font-bold">Dopuni kredite</h2>
          <p className="text-muted-foreground mb-6 mt-1 text-sm">
            Plaćanje je trenutno simulirano — krediti se dodaju odmah.
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4">
            {KREDIT_PAKETI.map((paket) => (
              <div
                key={paket.krediti}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-lg border bg-background p-6 text-center",
                  paket.popularno && "border-primary shadow-[0_0_0_1px_var(--primary)]",
                )}
              >
                {paket.popularno && (
                  <Badge className="absolute -top-3">Najpopularnije</Badge>
                )}
                <span className="text-3xl font-extrabold">{paket.krediti}</span>
                <span className="text-muted-foreground text-xs tracking-wide uppercase">
                  kredita
                </span>
                <span className="text-primary mt-1 text-lg font-bold">
                  {paket.cijenaKM} KM
                </span>
                <Button
                  type="button"
                  className="mt-2 w-full"
                  onClick={() => kupi(paket.krediti)}
                  disabled={kupujem !== null}
                >
                  {kupujem === paket.krediti ? "Obrada..." : "Kupi"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-8">
          <h2 className="text-xl font-bold">Istorija transakcija</h2>
          {transakcije.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-sm">
              Još nemate transakcija.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col">
              {transakcije.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-4 border-b py-4 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-semibold">
                      {t.opis ?? KREDIT_TIP_LABELS[t.tip] ?? t.tip}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {formatDatum(t.created_at)}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5 whitespace-nowrap">
                    <span
                      className={cn(
                        "text-lg font-bold",
                        t.iznos >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive",
                      )}
                    >
                      {t.iznos >= 0 ? `+${t.iznos}` : t.iznos}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      stanje: {t.saldo_poslije}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
