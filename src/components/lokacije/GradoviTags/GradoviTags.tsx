"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MAX_VISIBLE = 8;

type GradoviTagsProps = {
  gradovi: string[];
};

export function GradoviTags({ gradovi }: GradoviTagsProps) {
  const [expanded, setExpanded] = useState(false);

  if (gradovi.length === 0) return null;

  const hasMore = gradovi.length > MAX_VISIBLE;
  const visible = expanded || !hasMore ? gradovi : gradovi.slice(0, MAX_VISIBLE);
  const hiddenCount = gradovi.length - MAX_VISIBLE;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((grad) => (
        <Badge key={grad} variant="secondary">
          {grad}
        </Badge>
      ))}
      {hasMore && !expanded && (
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="rounded-full border-dashed"
          onClick={() => setExpanded(true)}
          aria-label={`Prikaži još ${hiddenCount} gradova`}
        >
          i još {hiddenCount}
        </Button>
      )}
      {hasMore && expanded && (
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="rounded-full border-dashed"
          onClick={() => setExpanded(false)}
        >
          Prikaži manje
        </Button>
      )}
    </div>
  );
}
