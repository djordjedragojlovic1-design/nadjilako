import { AppLink } from "@/components/ui/AppLink";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PosaljiPorukuButton } from "@/components/chat/PosaljiPorukuButton";
import { PratiociControl } from "@/components/profil/PratiociControl";
import { StarRating } from "@/components/usluge/StarRating/StarRating";
import { UslugaCard } from "@/components/usluge/UslugaCard/UslugaCard";
import { formatDatum } from "@/lib/usluge/utils";
import { buildMapsEmbedUrl } from "@/lib/lokacije/maps";
import type { KorisnikReviewStats, UslugaListItem } from "@/lib/usluge/types";
import type { KorisnikProfil } from "@/lib/korisnik/queries";
import { cn } from "@/lib/utils";

type ProfilViewProps = {
  korisnik: KorisnikProfil;
  usluge: UslugaListItem[];
  isOwner: boolean;
  viewerId: number | null;
  reviewStats: KorisnikReviewStats;
  brojPratilaca: number;
  viewerPrati: boolean;
};

function getInitials(ime: string, prezime: string) {
  return `${ime.charAt(0)}${prezime.charAt(0)}`.toUpperCase();
}

export function ProfilView({
  korisnik,
  usluge,
  isOwner,
  viewerId,
  reviewStats,
  brojPratilaca,
  viewerPrati,
}: ProfilViewProps) {
  const lokacija = korisnik.lokacija?.trim() || null;
  const lokacijaEmbedUrl = lokacija ? buildMapsEmbedUrl(lokacija) : null;

  return (
    <>
      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
          <Avatar className="size-24 shrink-0 text-2xl">
            {korisnik.profilna_slika ? (
              <AvatarImage src={korisnik.profilna_slika} alt="" />
            ) : null}
            <AvatarFallback className="bg-primary font-bold text-primary-foreground">
              {getInitials(korisnik.ime, korisnik.prezime)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {korisnik.ime} {korisnik.prezime}
              </h1>
            </div>
            <p className="text-muted-foreground">@{korisnik.korisnicko_ime}</p>

            <PratiociControl
              profilId={korisnik.id}
              viewerId={viewerId}
              isOwner={isOwner}
              initialFollowing={viewerPrati}
              initialCount={brojPratilaca}
            />

            {reviewStats.brojRecenzija > 0 && (
              <div className="mt-2">
                <StarRating
                  rating={reviewStats.prosecnaOcjena}
                  reviewCount={reviewStats.brojRecenzija}
                />
              </div>
            )}

            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {korisnik.drzava}
              </Badge>
              {korisnik.is_verified && (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Verifikovan
                </Badge>
              )}
              {isOwner && (
                <Badge variant="secondary">{korisnik.krediti} kredita</Badge>
              )}
            </div>

            {korisnik.inf_o_korisniku && (
              <p className="text-muted-foreground mt-4 text-[0.9375rem] leading-relaxed whitespace-pre-wrap">
                {korisnik.inf_o_korisniku}
              </p>
            )}

            <p className="text-muted-foreground mt-4 text-sm">
              Član od {formatDatum(korisnik.created_at)} · {usluge.length}{" "}
              {usluge.length === 1 ? "usluga" : "usluga"}
            </p>

            {isOwner ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <AppLink
                  href="/uredi-profil"
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Uredi profil
                </AppLink>
                <AppLink
                  href="/objavi-uslugu"
                  className={cn(buttonVariants())}
                >
                  Objavi uslugu
                </AppLink>
                <AppLink
                  href="/pratioci"
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Pratioci
                </AppLink>
                <AppLink
                  href="/sacuvane-objave"
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Sačuvane objave
                </AppLink>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <PosaljiPorukuButton
                  viewerId={viewerId}
                  primalacId={korisnik.id}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="usluge" className="mt-12">
        <TabsList>
          <TabsTrigger value="usluge">
            {isOwner ? "Moje usluge" : "Objavljene usluge"}
          </TabsTrigger>
          {lokacija && <TabsTrigger value="lokacija">Lokacija</TabsTrigger>}
        </TabsList>

        <TabsContent value="usluge" className="mt-6">
          {usluge.length === 0 ? (
            <p className="rounded-xl border border-dashed px-8 py-12 text-center text-muted-foreground">
              {isOwner
                ? "Još niste objavili nijednu uslugu. Kliknite „Objavi uslugu”."
                : "Korisnik još nema objavljenih usluga."}
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
              {usluge.map((usluga) => (
                <UslugaCard key={usluga.id} usluga={usluga} isOwner={isOwner} />
              ))}
            </div>
          )}
        </TabsContent>

        {lokacija && (
          <TabsContent value="lokacija" className="mt-6">
            <div className="space-y-3">
              {lokacijaEmbedUrl && (
                <div className="overflow-hidden rounded-xl border">
                  <iframe
                    title="Lokacija"
                    src={lokacijaEmbedUrl}
                    className="h-[420px] w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
              <a
                href={lokacija}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Otvori lokaciju u Google Maps
              </a>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
