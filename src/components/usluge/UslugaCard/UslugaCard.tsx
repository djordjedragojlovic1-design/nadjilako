import Image from "next/image";
import { AppLink } from "@/components/ui/AppLink";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { StarRating } from "@/components/usluge/StarRating/StarRating";
import { TIP_CIJENE_LABELS, VALUTA_LABELS } from "@/lib/usluge/constants";
import { formatCijena, formatDatum } from "@/lib/usluge/utils";
import { cn } from "@/lib/utils";
import type { UslugaListItem } from "@/lib/usluge/types";

const CIJENA_LABELS = { ...VALUTA_LABELS, ...TIP_CIJENE_LABELS };

type UslugaCardProps = {
  usluga: UslugaListItem;
  isOwner?: boolean;
};

export function UslugaCard({ usluga, isOwner = false }: UslugaCardProps) {
  const badge =
    usluga.promocija === "izdvojeno+" ? (
      <Badge className="absolute top-2 left-2 z-10 border-0 bg-amber-200 text-[0.6875rem] font-bold tracking-wide text-amber-900 uppercase">
        Izdvojeno+
      </Badge>
    ) : usluga.promocija === "izdvojeno" ? (
      <Badge className="absolute top-2 left-2 z-10 border-0 bg-blue-200 text-[0.6875rem] font-bold tracking-wide text-blue-900 uppercase">
        Izdvojeno
      </Badge>
    ) : null;

  return (
    <Card
      className={cn(
        "h-full gap-0 py-0 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lg",
        usluga.promocija === "izdvojeno+" &&
          "border-amber-600 bg-gradient-to-br from-amber-400/15 to-card shadow-[0_0_0_1px_color-mix(in_srgb,#f59e0b_25%,transparent)]",
        usluga.promocija === "izdvojeno" &&
          "border-blue-600 bg-gradient-to-br from-blue-500/10 to-card shadow-[0_0_0_1px_color-mix(in_srgb,#3b82f6_20%,transparent)]",
      )}
    >
      <AppLink href={`/usluga/${usluga.id}`} className="block text-inherit no-underline">
        <div className="relative aspect-[16/10] bg-muted">
          {badge}
          <Image
            src={usluga.slikaUrl ?? "/placeholder-usluga.svg"}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            unoptimized={(usluga.slikaUrl ?? "").startsWith("http")}
          />
        </div>
      </AppLink>
      <CardContent className="flex flex-1 flex-col gap-1 pt-3 pb-3">
        <div className="flex items-center justify-between gap-4">
          <AppLink
            href={`/usluga/${usluga.id}`}
            className="flex min-w-0 flex-col gap-1 text-inherit no-underline"
          >
            <h3 className="text-[0.9375rem] leading-snug font-bold">{usluga.naziv}</h3>
            {usluga.informacije && (
              <p className="line-clamp-2 text-[0.8125rem] leading-snug text-muted-foreground">
                {usluga.informacije}
              </p>
            )}
          </AppLink>
          {isOwner && (
            <AppLink
              href={`/usluga/${usluga.id}/uredi`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
            >
              Uredi
            </AppLink>
          )}
        </div>
        <div className="mt-auto">
          <div className="border-t py-2">
            <StarRating
              rating={usluga.prosecnaOcjena}
              reviewCount={usluga.brojRecenzija}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 border-t bg-muted/50">
        <p className="text-[0.6875rem] text-muted-foreground">
          Objavljeno {formatDatum(usluga.created_at)}
        </p>
        <p className="shrink-0 text-right text-sm leading-tight font-bold text-primary">
          {formatCijena(usluga.cijena, usluga.tip_cijene, usluga.valuta, CIJENA_LABELS)}
        </p>
      </CardFooter>
    </Card>
  );
}
