"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type UslugaSlikeLightboxProps = {
  slike: string[];
  alt: string;
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange?: (index: number) => void;
};

function isRemoteImage(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function UslugaSlikeLightbox({
  slike,
  alt,
  initialIndex = 0,
  open,
  onOpenChange,
  onIndexChange,
}: UslugaSlikeLightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const count = slike.length;
  const hasMultiple = count > 1;

  const goTo = useCallback(
    (next: number) => {
      const wrapped = ((next % count) + count) % count;
      setIndex(wrapped);
      onIndexChange?.(wrapped);
    },
    [count, onIndexChange],
  );

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    if (!open || !hasMultiple) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hasMultiple, goPrev, goNext]);

  const src = slike[index];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        overlayClassName="z-[120] bg-black/35 backdrop-blur-[2px]"
        className="z-[120] flex max-h-[95vh] w-[min(96vw,72rem)] max-w-none flex-col gap-0 overflow-hidden border border-white/10 bg-black/45 p-0 text-white shadow-2xl ring-0 backdrop-blur-md sm:max-w-none [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:bg-white/15"
      >
        <DialogTitle className="sr-only">
          {alt} — slika {index + 1} od {count}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Pregled slika usluge u punoj veličini. Koristite strelice za listanje.
        </DialogDescription>

        <div className="relative flex min-h-[40vh] flex-1 items-center justify-center px-12 py-4">
          {hasMultiple && (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="absolute top-1/2 left-2 z-10 -translate-y-1/2 text-white hover:bg-white/15 hover:text-white"
              onClick={goPrev}
              aria-label="Prethodna slika"
            >
              <ChevronLeft className="size-6" />
            </Button>
          )}

          <div className="flex max-h-[calc(95vh-8rem)] w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${alt} — slika ${index + 1}`}
              className="max-h-[calc(95vh-8rem)] max-w-full object-contain"
              draggable={false}
            />
          </div>

          {hasMultiple && (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="absolute top-1/2 right-2 z-10 -translate-y-1/2 text-white hover:bg-white/15 hover:text-white"
              onClick={goNext}
              aria-label="Sljedeća slika"
            >
              <ChevronRight className="size-6" />
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/15 bg-black/25 px-4 py-3 backdrop-blur-sm">
          {hasMultiple && (
            <p className="text-center text-sm text-white/70">
              {index + 1} / {count}
            </p>
          )}
          {hasMultiple && (
            <div className="flex justify-center gap-2 overflow-x-auto pb-1">
              {slike.map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  className={cn(
                    "relative size-14 shrink-0 overflow-hidden rounded-md border-2 transition-opacity",
                    i === index
                      ? "border-white opacity-100"
                      : "border-transparent opacity-50 hover:opacity-80",
                  )}
                  onClick={() => goTo(i)}
                  aria-label={`Slika ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized={isRemoteImage(url)}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
