"use client";

import Image from "next/image";
import { useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PosaljiPorukuButton } from "@/components/chat/PosaljiPorukuButton";
import { SacuvajButton } from "@/components/usluge/SacuvajButton/SacuvajButton";
import { PromocijaPanel } from "@/components/usluge/PromocijaPanel/PromocijaPanel";
import { UslugaSlikeLightbox } from "@/components/usluge/UslugaSlikeLightbox/UslugaSlikeLightbox";
import { StarRating } from "@/components/usluge/StarRating/StarRating";
import { RecenzijeSekcija } from "@/components/usluge/RecenzijeSekcija/RecenzijeSekcija";
import {
  STATUS_LABELS,
  TIP_CIJENE_LABELS,
  VALUTA_LABELS,
} from "@/lib/usluge/constants";
import { GradoviTags } from "@/components/lokacije/GradoviTags/GradoviTags";
import type { RecenzijaItem, UslugaDetail } from "@/lib/usluge/types";
import { formatCijena, formatDatum, PLACEHOLDER_IMAGE } from "@/lib/usluge/utils";
import { cn } from "@/lib/utils";

type Tab = "detalji" | "recenzije";

type UslugaDetailViewProps = {
  usluga: UslugaDetail;
  recenzije: RecenzijaItem[];
  isOwner?: boolean;
  viewerId?: number | null;
  viewerSaved?: boolean;
};

function getInitials(ime: string, prezime: string): string {
  return `${ime.charAt(0)}${prezime.charAt(0)}`.toUpperCase();
}

function isRemoteImage(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function UslugaDetailView({
  usluga,
  recenzije,
  isOwner = false,
  viewerId = null,
  viewerSaved = false,
}: UslugaDetailViewProps) {
  const [tab, setTab] = useState<Tab>("detalji");
  const slike = usluga.slike.length > 0 ? usluga.slike : [PLACEHOLDER_IMAGE];
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const mainSrc = slike[activeImage];

  const openLightbox = (index: number) => {
    setActiveImage(index);
    setLightboxOpen(true);
  };

  const isActive = usluga.status === "aktivno";
  const statusLabel = STATUS_LABELS[usluga.status] ?? usluga.status;

  return (
    <article className="grid gap-8 md:grid-cols-2 md:items-start">
      <div>
        <button
          type="button"
          className="group relative aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-xl border bg-muted"
          onClick={() => openLightbox(activeImage)}
          aria-label="Otvori sliku u punoj veličini"
        >
          <Image
            src={mainSrc}
            alt={usluga.naziv}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
            className="object-cover transition-opacity group-hover:opacity-95"
            unoptimized={isRemoteImage(mainSrc)}
          />
        </button>
        {slike.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {slike.map((url, i) => (
              <button
                key={url + i}
                type="button"
                className={cn(
                  "relative size-[4.5rem] shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 opacity-70 transition-[opacity,border-color]",
                  i === activeImage ? "border-primary opacity-100" : "border-transparent",
                )}
                onClick={() => openLightbox(i)}
                aria-label={`Slika ${i + 1}`}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="72px"
                  className="object-cover"
                  unoptimized={isRemoteImage(url)}
                />
              </button>
            ))}
          </div>
        )}

        <UslugaSlikeLightbox
          slike={slike}
          alt={usluga.naziv}
          initialIndex={activeImage}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          onIndexChange={setActiveImage}
        />
      </div>

      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-4">
          {usluga.promocija === "izdvojeno+" && (
            <Badge className="w-fit border-0 bg-amber-200 text-xs font-bold text-amber-900 uppercase">
              Izdvojeno+
            </Badge>
          )}
          {usluga.promocija === "izdvojeno" && (
            <Badge className="w-fit border-0 bg-blue-200 text-xs font-bold text-blue-900 uppercase">
              Izdvojeno
            </Badge>
          )}
          <h1 className="text-2xl leading-tight font-bold tracking-tight md:text-3xl lg:text-4xl">
            {usluga.naziv}
          </h1>
          <StarRating
            rating={usluga.prosecnaOcjena}
            reviewCount={usluga.brojRecenzija}
          />
          <p className="text-primary text-xl font-bold md:text-[1.375rem]">
            {formatCijena(usluga.cijena, usluga.tip_cijene, usluga.valuta, {
              ...VALUTA_LABELS,
              ...TIP_CIJENE_LABELS,
            })}
          </p>
          <p
            className={cn(
              "inline-flex w-fit items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium",
              isActive
                ? "bg-green-500/15 text-green-600 dark:text-green-400"
                : "bg-destructive/12 text-destructive",
            )}
          >
            <span className="size-2 rounded-full bg-current" aria-hidden />
            {statusLabel}
          </p>
          {isOwner ? (
            <AppLink
              href={`/usluga/${usluga.id}/uredi`}
              className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
            >
              Uredi uslugu
            </AppLink>
          ) : (
            <SacuvajButton
              viewerId={viewerId}
              uslugaId={usluga.id}
              initialSaved={viewerSaved}
            />
          )}
        </header>

        {isOwner && (
          <PromocijaPanel
            uslugaId={usluga.id}
            promocija={usluga.promocija}
            promovisanoDo={usluga.promovisano_do ?? null}
            promovisanoOd={usluga.promovisano_od ?? null}
          />
        )}

        {(usluga.mjesta.drzave.length > 0 || usluga.mjesta.gradovi.length > 0) ? (
          <div className="flex flex-col gap-2">
            {usluga.mjesta.drzave.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                  Države
                </p>
                <div className="flex flex-wrap gap-1">
                  {usluga.mjesta.drzave.map((d) => (
                    <Badge key={d} variant="secondary" className="font-normal">
                      {d}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {usluga.mjesta.gradovi.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                  Gradovi
                </p>
                <GradoviTags gradovi={usluga.mjesta.gradovi} />
              </div>
            )}
          </div>
        ) : null}

        {usluga.pruzalac && (
          <Card>
            <CardContent className="flex flex-wrap items-center gap-4 pt-6">
              <Avatar size="lg" className="bg-primary text-primary-foreground">
                {usluga.pruzalac.profilna_slika ? (
                  <AvatarImage src={usluga.pruzalac.profilna_slika} alt="" />
                ) : null}
                <AvatarFallback className="bg-primary font-bold text-primary-foreground">
                  {getInitials(usluga.pruzalac.ime, usluga.pruzalac.prezime)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {usluga.pruzalac.ime} {usluga.pruzalac.prezime}
                </p>
                <AppLink
                  href={`/profil/${usluga.pruzalac.id}`}
                  className="text-primary text-sm hover:underline"
                >
                  @{usluga.pruzalac.korisnicko_ime}
                </AppLink>
              </div>
              {!isOwner && (
                <PosaljiPorukuButton
                  viewerId={viewerId}
                  primalacId={usluga.pruzalac.id}
                  uslugaId={usluga.id}
                  label="Kontaktiraj"
                  className="ml-auto"
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="col-span-full">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList variant="line" className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="detalji" className="rounded-none px-4 py-3">
              Detalji
            </TabsTrigger>
            <TabsTrigger value="recenzije" className="rounded-none px-4 py-3">
              Recenzije ({usluga.brojRecenzija})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detalji" className="pt-6">
            {usluga.informacije ? (
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {usluga.informacije}
              </p>
            ) : (
              <p className="text-muted-foreground leading-relaxed">Nema dodatnih informacija.</p>
            )}
            <div className="text-muted-foreground mt-4 flex flex-wrap gap-4 text-sm">
              <span>Objavljeno: {formatDatum(usluga.created_at)}</span>
              {usluga.tip_cijene && (
                <span>
                  Tip cijene: {TIP_CIJENE_LABELS[usluga.tip_cijene] ?? usluga.tip_cijene}
                </span>
              )}
              {usluga.valuta && (
                <span>Valuta: {VALUTA_LABELS[usluga.valuta] ?? usluga.valuta}</span>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recenzije" className="pt-6">
            <RecenzijeSekcija
              uslugaId={usluga.id}
              ocjenjenId={usluga.korisnik_id}
              recenzije={recenzije}
            />
          </TabsContent>
        </Tabs>
      </div>
    </article>
  );
}
