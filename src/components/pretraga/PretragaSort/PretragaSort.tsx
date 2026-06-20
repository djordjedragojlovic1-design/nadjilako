"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPCIJE, type UslugaSortKey } from "@/lib/usluge/constants";

type PretragaSortProps = {
  value: UslugaSortKey;
};

export function PretragaSort({ value }: PretragaSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (next: UslugaSortKey | null) => {
    if (!next) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", next);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const sortLabel =
    SORT_OPCIJE.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="inline-flex items-center gap-2">
      <Label htmlFor="pretraga-sort" className="text-muted-foreground text-sm">
        Sortiraj
      </Label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger id="pretraga-sort" className="min-w-[10rem] font-medium">
          <SelectValue>{sortLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SORT_OPCIJE.map((opcija) => (
            <SelectItem key={opcija.value} value={opcija.value}>
              {opcija.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
