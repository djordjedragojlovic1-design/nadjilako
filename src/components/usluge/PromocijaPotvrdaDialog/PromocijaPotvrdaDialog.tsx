"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PROMO_CIJENE,
  PROMO_LABELS,
  PROMO_TRAJANJE_DANA,
  PROMO_UPGRADE_RAZLIKA,
  type PromoTip,
} from "@/lib/krediti/constants";
import type { PromoPonuda } from "@/lib/krediti/promocija";

type PromocijaPotvrdaDialogProps = {
  open: boolean;
  ponuda: PromoPonuda;
  promovisanoDo: string | null;
  novoDo: Date;
  krediti: number;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function formatDatum(d: Date | string): string {
  return new Intl.DateTimeFormat("sr-Latn-BA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(typeof d === "string" ? new Date(d) : d);
}

export function PromocijaPotvrdaDialog({
  open,
  ponuda,
  promovisanoDo,
  novoDo,
  krediti,
  pending,
  onClose,
  onConfirm,
}: PromocijaPotvrdaDialogProps) {
  const { ciljaniTip, ukupno, akcija, upgradeVarijanta } = ponuda;
  const nedovoljno = krediti < ukupno;
  const naslov =
    akcija === "upgrade" ? "Potvrda nadogradnje" : "Potvrda promocije";

  const ranaUpgrade =
    akcija === "upgrade" && upgradeVarijanta === "rana";

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !pending) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>{naslov}</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-sm leading-normal">
          {akcija === "upgrade" ? (
            <>
              Nadograditi sa „{PROMO_LABELS.izdvojeno}&quot; na „
              {PROMO_LABELS[ciljaniTip as PromoTip]}&quot;?
            </>
          ) : (
            <>
              Promovisati uslugu kao „{PROMO_LABELS[ciljaniTip as PromoTip]}&quot; na{" "}
              {PROMO_TRAJANJE_DANA} dana?
            </>
          )}
        </p>

        <dl className="mt-4 flex flex-col gap-2">
          {ranaUpgrade && (
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">Naknada razlike</dt>
              <dd className="font-semibold">{PROMO_UPGRADE_RAZLIKA} kredita</dd>
            </div>
          )}
          {akcija === "upgrade" && upgradeVarijanta === "puna" && (
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">Puna cijena (Izdvojeno+)</dt>
              <dd className="font-semibold">{PROMO_CIJENE["izdvojeno+"]} kredita</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t pt-2 text-base font-bold">
            <dt>Ukupno</dt>
            <dd>{ukupno} kredita</dd>
          </div>
          {akcija === "upgrade" && (
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">
                {ranaUpgrade ? "Rok (ostaje isti)" : "Novi rok"}
              </dt>
              <dd className="text-right font-semibold">
                do {formatDatum(ranaUpgrade && promovisanoDo ? promovisanoDo : novoDo)}
              </dd>
            </div>
          )}
          {akcija === "nova" && (
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">Traje do</dt>
              <dd className="font-semibold">{formatDatum(novoDo)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-muted-foreground">Vaše stanje</dt>
            <dd className="font-semibold">{krediti} kredita</dd>
          </div>
        </dl>

        {nedovoljno && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>Nemate dovoljno kredita za ovu akciju.</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="mt-2 sm:justify-stretch">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={pending}
          >
            Odustani
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={onConfirm}
            disabled={pending || nedovoljno}
          >
            {pending ? "Obrada..." : `Plati ${ukupno} kredita`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
