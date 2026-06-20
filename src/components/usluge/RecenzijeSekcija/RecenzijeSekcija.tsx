"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/providers/AuthProvider";
import { StarRating } from "@/components/usluge/StarRating/StarRating";
import { RecenzijaForm } from "@/components/usluge/RecenzijaForm/RecenzijaForm";
import {
  createOdgovorClient,
  deleteOdgovorClient,
  deleteRecenzijaClient,
  KOMENTAR_MAX,
} from "@/lib/usluge/recenzije-client";
import type { OdgovorItem, RecenzijaItem } from "@/lib/usluge/types";
import { formatDatum } from "@/lib/usluge/utils";

type RecenzijeSekcijaProps = {
  uslugaId: number;
  ocjenjenId: number;
  recenzije: RecenzijaItem[];
};

function getInitials(ime: string, prezime: string): string {
  return `${ime.charAt(0)}${prezime.charAt(0)}`.toUpperCase();
}

function ReviewAvatar({
  slika,
  ime,
  prezime,
  size = "default",
}: {
  slika: string | null;
  ime: string;
  prezime: string;
  size?: "default" | "sm";
}) {
  return (
    <Avatar size={size} className="bg-primary/10 text-primary">
      {slika ? <AvatarImage src={slika} alt="" /> : null}
      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
        {getInitials(ime, prezime)}
      </AvatarFallback>
    </Avatar>
  );
}

function OdgovorForm({
  uslugaId,
  parentId,
  ocjenjenId,
  ocjenjivacId,
  onSuccess,
  onCancel,
}: {
  uslugaId: number;
  parentId: number;
  ocjenjenId: number;
  ocjenjivacId: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [tekst, setTekst] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await createOdgovorClient({
      parentId,
      uslugaId,
      ocjenjivacId,
      ocjenjenId,
      komentar: tekst,
    });

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setPending(false);
    setTekst("");
    onSuccess();
  }

  return (
    <form className="mt-4 flex flex-col gap-2" onSubmit={handleSubmit}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Textarea
        rows={2}
        maxLength={KOMENTAR_MAX}
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        placeholder="Napišite odgovor..."
        disabled={pending}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Slanje..." : "Pošalji"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={pending}>
          Odustani
        </Button>
      </div>
    </form>
  );
}

function Odgovor({
  odgovor,
  mojeId,
  onDelete,
}: {
  odgovor: OdgovorItem;
  mojeId: number | null;
  onDelete: (id: number) => void;
}) {
  return (
    <li className="flex gap-2">
      <AppLink
        href={`/profil/${odgovor.ocjenjivac.id}`}
        className="shrink-0 rounded-full"
        aria-label={`Profil korisnika ${odgovor.ocjenjivac.ime} ${odgovor.ocjenjivac.prezime}`}
      >
        <ReviewAvatar
          slika={odgovor.ocjenjivac.profilna_slika}
          ime={odgovor.ocjenjivac.ime}
          prezime={odgovor.ocjenjivac.prezime}
          size="sm"
        />
      </AppLink>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <AppLink
            href={`/profil/${odgovor.ocjenjivac.id}`}
            className="text-sm font-semibold hover:underline"
          >
            {odgovor.ocjenjivac.ime} {odgovor.ocjenjivac.prezime}
          </AppLink>
          <span className="text-muted-foreground text-xs">{formatDatum(odgovor.created_at)}</span>
          {mojeId === odgovor.ocjenjivac.id && (
            <Button
              type="button"
              variant="link"
              size="xs"
              className="text-destructive h-auto p-0 text-xs"
              onClick={() => onDelete(odgovor.id)}
            >
              Obriši
            </Button>
          )}
        </div>
        <p className="text-muted-foreground text-sm leading-normal whitespace-pre-wrap">
          {odgovor.komentar}
        </p>
      </div>
    </li>
  );
}

export function RecenzijeSekcija({
  uslugaId,
  ocjenjenId,
  recenzije,
}: RecenzijeSekcijaProps) {
  const router = useRouter();
  const { korisnik, loading } = useAuth();
  const mojeId = korisnik?.id ?? null;
  const jeVlasnik = mojeId != null && mojeId === ocjenjenId;
  const mojaRecenzija = recenzije.find((r) => r.ocjenjivac.id === mojeId);

  const [editujem, setEditujem] = useState(false);
  const [odgovorOtvoren, setOdgovorOtvoren] = useState<number | null>(null);

  function osvjezi() {
    setEditujem(false);
    setOdgovorOtvoren(null);
    router.refresh();
  }

  async function obrisiRecenziju(id: number) {
    if (!window.confirm("Obrisati vašu recenziju?")) return;
    const result = await deleteRecenzijaClient(id);
    if (result.error) {
      window.alert(result.error);
      return;
    }
    router.refresh();
  }

  async function obrisiOdgovor(id: number) {
    if (!window.confirm("Obrisati odgovor?")) return;
    const result = await deleteOdgovorClient(id);
    if (result.error) {
      window.alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {!loading && (
        <div className="flex flex-col">
          {!korisnik ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              <AppLink href="/prijava" className="text-primary font-semibold hover:underline">
                Prijavite se
              </AppLink>{" "}
              da biste ostavili recenziju.
            </p>
          ) : jeVlasnik ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Ovo je vaša usluga — ne možete je ocijeniti, ali možete odgovoriti
              na recenzije.
            </p>
          ) : !mojaRecenzija ? (
            <RecenzijaForm
              uslugaId={uslugaId}
              ocjenjivacId={korisnik.id}
              ocjenjenId={ocjenjenId}
              userUuid={korisnik.user_uuid}
              onSuccess={osvjezi}
            />
          ) : null}
        </div>
      )}

      {recenzije.length === 0 ? (
        <p className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Još nema recenzija za ovu uslugu.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {recenzije.map((r) =>
            mojaRecenzija &&
            r.id === mojaRecenzija.id &&
            editujem &&
            korisnik ? (
              <li key={r.id}>
                <RecenzijaForm
                  uslugaId={uslugaId}
                  ocjenjivacId={korisnik.id}
                  ocjenjenId={ocjenjenId}
                  userUuid={korisnik.user_uuid}
                  initial={{
                    id: r.id,
                    ocjena: r.ocjena,
                    komentar: r.komentar,
                    slika: r.slika,
                  }}
                  onSuccess={osvjezi}
                  onCancel={() => setEditujem(false)}
                />
              </li>
            ) : (
              <li key={r.id}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="mb-2 flex items-center gap-4">
                      <AppLink
                        href={`/profil/${r.ocjenjivac.id}`}
                        className="group flex min-w-0 flex-1 items-center gap-4"
                      >
                        <ReviewAvatar
                          slika={r.ocjenjivac.profilna_slika}
                          ime={r.ocjenjivac.ime}
                          prezime={r.ocjenjivac.prezime}
                        />
                        <div className="min-w-0">
                          <p className="text-[0.9375rem] font-semibold group-hover:underline">
                            {r.ocjenjivac.ime} {r.ocjenjivac.prezime}
                          </p>
                          <p className="text-muted-foreground text-xs">{formatDatum(r.created_at)}</p>
                        </div>
                      </AppLink>
                      <StarRating rating={r.ocjena} showCount={false} />
                    </div>

                    {r.komentar && (
                      <p className="text-muted-foreground text-[0.9375rem] leading-relaxed whitespace-pre-wrap">
                        {r.komentar}
                      </p>
                    )}
                    {r.slika && (
                      <div className="relative mt-4 aspect-[16/10] w-full max-w-xs overflow-hidden rounded-lg">
                        <Image
                          src={r.slika}
                          alt=""
                          fill
                          sizes="320px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-4">
                      {korisnik && (
                        <Button
                          type="button"
                          variant="link"
                          size="xs"
                          className="h-auto p-0 text-xs"
                          onClick={() =>
                            setOdgovorOtvoren((prev) =>
                              prev === r.id ? null : r.id,
                            )
                          }
                        >
                          Odgovori
                        </Button>
                      )}
                      {mojeId === r.ocjenjivac.id && (
                        <>
                          <Button
                            type="button"
                            variant="link"
                            size="xs"
                            className="h-auto p-0 text-xs"
                            onClick={() => setEditujem(true)}
                          >
                            Uredi
                          </Button>
                          <Button
                            type="button"
                            variant="link"
                            size="xs"
                            className="text-destructive h-auto p-0 text-xs"
                            onClick={() => obrisiRecenziju(r.id)}
                          >
                            Obriši
                          </Button>
                        </>
                      )}
                    </div>

                    {(r.odgovori.length > 0 || odgovorOtvoren === r.id) && (
                      <ul className="mt-4 flex flex-col gap-2 border-l-2 pl-4">
                        {r.odgovori.map((o) => (
                          <Odgovor
                            key={o.id}
                            odgovor={o}
                            mojeId={mojeId}
                            onDelete={obrisiOdgovor}
                          />
                        ))}
                      </ul>
                    )}

                    {odgovorOtvoren === r.id && korisnik && (
                      <OdgovorForm
                        uslugaId={uslugaId}
                        parentId={r.id}
                        ocjenjenId={ocjenjenId}
                        ocjenjivacId={korisnik.id}
                        onSuccess={osvjezi}
                        onCancel={() => setOdgovorOtvoren(null)}
                      />
                    )}
                  </CardContent>
                </Card>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
