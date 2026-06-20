"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

const OZNAKE = ["Loše", "Slabo", "Dobro", "Vrlo dobro", "Odlično"];

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      className={cn("size-7", filled ? "text-amber-500" : "text-inherit")}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
      />
    </svg>
  );
}

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
}: StarRatingInputProps) {
  const [hover, setHover] = useState(0);
  const prikazana = hover || value;

  return (
    <div className="flex items-center gap-4">
      <div
        className="inline-flex gap-0.5"
        role="radiogroup"
        aria-label="Ocjena"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? "zvjezdica" : "zvjezdice"}`}
            className="inline-flex border-none bg-transparent p-0.5 text-border transition-transform hover:scale-110 disabled:cursor-not-allowed"
            disabled={disabled}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
          >
            <Star filled={n <= prikazana} />
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-muted-foreground">
        {prikazana > 0 ? OZNAKE[prikazana - 1] : "Izaberite ocjenu"}
      </span>
    </div>
  );
}
