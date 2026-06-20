"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { AppLink } from "@/components/ui/AppLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PromocijaPotvrdaDialog } from "@/components/usluge/PromocijaPotvrdaDialog/PromocijaPotvrdaDialog";
import { promovisiUsluguClient } from "@/lib/krediti/client";
import {
  PROMO_CIJENE,
  PROMO_LABELS,
  PROMO_OPIS,
  PROMO_TIPOVI,
  type PromoTip,
} from "@/lib/krediti/constants";
import {
  getAktivnaPromocija,
  getPromoPonuda,
  izracunajNovoPromovisanoDo,
  mozePromovisati,
  promoDugmeLabel,
  upgradeHint,
} from "@/lib/krediti/promocija";
import { cn } from "@/lib/utils";

type PromocijaPanelProps = {
  uslugaId: number;
  promocija: string | null;
  promovisanoDo: string | null;
  promovisanoOd: string | null;
};

function formatDatum(iso: string): string {
  return new Intl.DateTimeFormat("sr-Latn-BA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function PromocijaPanel({
  uslugaId,
  promocija,
  promovisanoDo,
  promovisanoOd,
}: PromocijaPanelProps) {
  const router = useRouter();
  const { korisnik, refreshProfile } = useAuth();
  const krediti = korisnik?.krediti ?? 0;

  const [pending, setPending] = useState(false);
  const [potvrdaTip, setPotvrdaTip] = useState<PromoTip | null>(null);
  const [poruka, setPoruka] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);

  const aktivna = getAktivnaPromocija(promocija, promovisanoDo);

  const potvrdaPonuda = useMemo(
    () =>
      potvrdaTip
        ? getPromoPonuda(aktivna, potvrdaTip, promovisanoOd, promovisanoDo)
        : null,
    [aktivna, potvrdaTip, promovisanoOd, promovisanoDo],
  );

  const potvrdaNovoDo = useMemo(() => {
    if (!potvrdaPonuda) return new Date();
    return izracunajNovoPromovisanoDo(potvrdaPonuda, promovisanoDo);
  }, [potvrdaPonuda, promovisanoDo]);

  function otvoriPotvrdu(tip: PromoTip) {
    const ponuda = getPromoPonuda(aktivna, tip, promovisanoOd, promovisanoDo);
    if (!mozePromovisati(ponuda)) return;
    setPotvrdaTip(tip);
    setGreska(null);
  }

  async function potvrdiPromociju() {
    if (!potvrdaTip || !potvrdaPonuda) return;

    setPending(true);
    setPoruka(null);
    setGreska(null);

    const { error, saldo } = await promovisiUsluguClient(uslugaId, potvrdaTip);

    if (error) {
      setGreska(error);
      setPending(false);
      return;
    }

    await refreshProfile();
    router.refresh();

    const uspjeh =
      potvrdaPonuda.akcija === "upgrade"
        ? `Usluga je nadograđena na ${PROMO_LABELS[potvrdaTip]}. Preostalo stanje: ${saldo ?? krediti} kredita.`
        : `Usluga je promovisana (${PROMO_LABELS[potvrdaTip]}). Preostalo stanje: ${saldo ?? krediti} kredita.`;

    setPoruka(uspjeh);
    setPotvrdaTip(null);
    setPending(false);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Promocija usluge</CardTitle>
          <Badge variant="secondary" className="text-primary bg-primary/10">
            {krediti} kredita
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {aktivna ? (
            <>
              <p className="text-sm">
                Trenutno aktivno: <strong>{PROMO_LABELS[aktivna]}</strong>
                {promovisanoDo && <> — do {formatDatum(promovisanoDo)}</>}
              </p>
              <CardDescription>
                {aktivna === "izdvojeno"
                  ? upgradeHint(promovisanoOd)
                  : "Nova promocija moguća je tek nakon isteka trenutne."}
              </CardDescription>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Usluga trenutno nije promovisana.</p>
          )}

          {greska && (
            <Alert variant="destructive">
              <AlertDescription>
                {greska}
                {greska.toLowerCase().includes("kredita") && (
                  <>
                    {" "}
                    <AppLink href="/krediti" className="font-semibold underline">
                      Dopuni kredite
                    </AppLink>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          {poruka && (
            <Alert>
              <AlertDescription>{poruka}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
            {PROMO_TIPOVI.map((tip) => {
              const ponuda = getPromoPonuda(
                aktivna,
                tip,
                promovisanoOd,
                promovisanoDo,
              );
              const dozvoljeno = mozePromovisati(ponuda);
              const cijena = dozvoljeno ? ponuda.ukupno : PROMO_CIJENE[tip];
              const nedovoljno = dozvoljeno && krediti < cijena;

              return (
                <Card
                  key={tip}
                  size="sm"
                  className={cn(!dozvoljeno && "opacity-70")}
                >
                  <CardContent className="flex flex-col gap-2 pt-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold">{PROMO_LABELS[tip]}</span>
                      <span className="text-primary shrink-0 text-sm font-semibold whitespace-nowrap">
                        {dozvoljeno && ponuda.akcija === "upgrade"
                          ? `${cijena} kredita (nadogradnja)`
                          : `${cijena} kredita`}
                      </span>
                    </div>
                    <p className="text-muted-foreground flex-1 text-[0.8125rem]">
                      {PROMO_OPIS[tip]}
                    </p>
                    <Button
                      type="button"
                      onClick={() => otvoriPotvrdu(tip)}
                      disabled={pending || !dozvoljeno || nedovoljno}
                    >
                      {promoDugmeLabel(ponuda)}
                    </Button>
                    {!dozvoljeno && ponuda.razlogBlokade && (
                      <span className="text-muted-foreground text-xs">{ponuda.razlogBlokade}</span>
                    )}
                    {dozvoljeno && nedovoljno && (
                      <span className="text-muted-foreground text-xs">
                        Nedovoljno kredita —{" "}
                        <AppLink href="/krediti" className="text-primary font-semibold hover:underline">
                          dopuni
                        </AppLink>
                      </span>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {potvrdaPonuda && potvrdaTip && (
        <PromocijaPotvrdaDialog
          open={potvrdaTip !== null}
          ponuda={potvrdaPonuda}
          promovisanoDo={promovisanoDo}
          novoDo={potvrdaNovoDo}
          krediti={krediti}
          pending={pending}
          onClose={() => {
            if (!pending) setPotvrdaTip(null);
          }}
          onConfirm={potvrdiPromociju}
        />
      )}
    </>
  );
}
