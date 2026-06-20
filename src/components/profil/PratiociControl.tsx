"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLink } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/button";
import { otpratiClient, zapratiClient } from "@/lib/pratioci/client";

type PratiociControlProps = {
  profilId: number;
  viewerId: number | null;
  isOwner: boolean;
  initialFollowing: boolean;
  initialCount: number;
};

function pratilacLabel(n: number): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod10 === 1 && mod100 !== 11) return "pratilac";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "pratioca";
  return "pratilaca";
}

export function PratiociControl({
  profilId,
  viewerId,
  isOwner,
  initialFollowing,
  initialCount,
}: PratiociControlProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  const brojText = (
    <span className="text-muted-foreground text-sm">
      <span className="text-foreground font-semibold">{count}</span>{" "}
      {pratilacLabel(count)}
    </span>
  );

  const toggle = async () => {
    if (viewerId == null) {
      router.push(`/prijava?next=${encodeURIComponent(`/profil/${profilId}`)}`);
      return;
    }

    const sljedece = !following;
    setPending(true);
    setFollowing(sljedece);
    setCount((c) => Math.max(0, c + (sljedece ? 1 : -1)));

    const { error } = sljedece
      ? await zapratiClient(profilId, viewerId)
      : await otpratiClient(profilId, viewerId);

    if (error) {
      // Vrati prethodno stanje pri grešci
      setFollowing(!sljedece);
      setCount((c) => Math.max(0, c + (sljedece ? -1 : 1)));
    }
    setPending(false);
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {isOwner ? (
        <AppLink href="/pratioci" className="hover:underline">
          {brojText}
        </AppLink>
      ) : (
        brojText
      )}

      {!isOwner && (
        <Button
          type="button"
          size="sm"
          variant={following ? "outline" : "default"}
          disabled={pending}
          onClick={toggle}
        >
          {following ? "Prati se" : "Zaprati"}
        </Button>
      )}
    </div>
  );
}
