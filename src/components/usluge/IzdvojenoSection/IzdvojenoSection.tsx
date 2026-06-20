"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UslugaCard } from "@/components/usluge/UslugaCard/UslugaCard";
import {
  IZDVJENO_INITIAL,
  IZDVJENO_MAX,
  IZDVJENO_STEP,
} from "@/lib/usluge/constants";
import type { UslugaListItem } from "@/lib/usluge/types";

type IzdvojenoSectionProps = {
  usluge: UslugaListItem[];
};

export function IzdvojenoSection({ usluge }: IzdvojenoSectionProps) {
  const [visible, setVisible] = useState(IZDVJENO_INITIAL);

  const shown = usluge.slice(0, visible);
  const canShowMore = visible < usluge.length && visible < IZDVJENO_MAX;
  const remaining = Math.min(IZDVJENO_STEP, usluge.length - visible, IZDVJENO_MAX - visible);

  return (
    <section className="mt-12" aria-labelledby="izdvojeno-heading">
      <header className="mb-8">
        <h2 id="izdvojeno-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
          Izdvojeno
        </h2>
        <p className="text-muted-foreground mt-2">
          Prvo promovisane usluge (Izdvojeno+ i Izdvojeno), zatim najbolje ocijenjene.
        </p>
      </header>

      {usluge.length === 0 ? (
        <p className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Trenutno nema aktivnih usluga za prikaz.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {shown.map((usluga) => (
              <UslugaCard key={usluga.id} usluga={usluga} />
            ))}
          </div>

          {canShowMore && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full px-7"
                onClick={() =>
                  setVisible((v) => Math.min(v + IZDVJENO_STEP, IZDVJENO_MAX, usluge.length))
                }
              >
                Prikaži još ({remaining})
              </Button>
              <p className="text-muted-foreground text-center text-[0.8125rem]">
                Prikazano {shown.length} od {Math.min(usluge.length, IZDVJENO_MAX)} usluga
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
