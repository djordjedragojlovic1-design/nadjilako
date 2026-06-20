"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  sacuvajObjavuClient,
  ukloniSacuvanuClient,
} from "@/lib/sacuvane-objave/client";

type SacuvajButtonProps = {
  viewerId: number | null;
  uslugaId: number;
  initialSaved: boolean;
  className?: string;
};

export function SacuvajButton({
  viewerId,
  uslugaId,
  initialSaved,
  className,
}: SacuvajButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (viewerId == null) {
      router.push(`/prijava?next=${encodeURIComponent(`/usluga/${uslugaId}`)}`);
      return;
    }

    const sljedece = !saved;
    setPending(true);
    setSaved(sljedece);

    const { error } = sljedece
      ? await sacuvajObjavuClient(viewerId, uslugaId)
      : await ukloniSacuvanuClient(viewerId, uslugaId);

    if (error) {
      setSaved(!sljedece);
    }
    setPending(false);
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("w-fit gap-2", className)}
      disabled={pending}
      onClick={toggle}
      aria-pressed={saved}
    >
      {saved ? (
        <BookmarkCheck className="size-4" />
      ) : (
        <Bookmark className="size-4" />
      )}
      {saved ? "Sačuvano" : "Sačuvaj"}
    </Button>
  );
}
