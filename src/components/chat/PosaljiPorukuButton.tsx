"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PosaljiPorukuButtonProps = {
  viewerId: number | null;
  primalacId: number;
  uslugaId?: number | null;
  label?: string;
  className?: string;
};

export function PosaljiPorukuButton({
  viewerId,
  primalacId,
  uslugaId = null,
  label = "Pošalji poruku",
  className,
}: PosaljiPorukuButtonProps) {
  const router = useRouter();

  const onClick = () => {
    const compose = `/chat/novi?korisnik=${primalacId}${
      uslugaId ? `&usluga=${uslugaId}` : ""
    }`;

    if (viewerId == null) {
      router.push(`/prijava?next=${encodeURIComponent(compose)}`);
      return;
    }
    router.push(compose);
  };

  return (
    <Button
      type="button"
      className={cn("gap-2", className)}
      onClick={onClick}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </Button>
  );
}
