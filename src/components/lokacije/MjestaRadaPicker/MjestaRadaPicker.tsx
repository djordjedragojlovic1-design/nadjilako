"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DRZAVE, gradoviZaDrzave, gradoviZaDrzavu } from "@/lib/lokacije/gradovi";
import type { Drzava } from "@/types/database";

const MAX_VISIBLE = 8;

type MjestaRadaPickerProps = {
  drzave: Drzava[];
  gradovi: string[];
  onDrzaveChange: (drzave: Drzava[]) => void;
  onGradoviChange: (gradovi: string[]) => void;
};

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase("sr");
}

function filterGradovi(cityList: string[], query: string): string[] {
  const q = normalizeSearch(query);
  if (!q) return cityList;
  return cityList.filter((g) => g.toLocaleLowerCase("sr").includes(q));
}

function getVisibleGradovi(
  cityList: string[],
  selected: string[],
  expanded: boolean,
  query: string,
): string[] {
  const filtered = filterGradovi(cityList, query);
  if (query.trim() || expanded) return filtered;

  const selectedInCountry = selected.filter((g) => cityList.includes(g));
  const unselected = cityList.filter((g) => !selectedInCountry.includes(g));
  const combined = [...selectedInCountry, ...unselected];
  return combined.slice(0, MAX_VISIBLE);
}

type CityGroupProps = {
  drzava: Drzava;
  gradovi: string[];
  onGradoviChange: (gradovi: string[]) => void;
};

function CheckboxTile({
  checked,
  onCheckedChange,
  children,
}: {
  checked: boolean;
  onCheckedChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <Label
      className={cn(
        "hover:border-primary flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-normal transition-colors",
        checked && "border-primary bg-primary/10",
      )}
    >
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      {children}
    </Label>
  );
}

function CityGroup({ drzava, gradovi, onGradoviChange }: CityGroupProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);

  const cityList = useMemo(() => gradoviZaDrzavu(drzava), [drzava]);
  const selectedCount = cityList.filter((g) => gradovi.includes(g)).length;
  const allSelected = selectedCount === cityList.length;

  const filteredCount = filterGradovi(cityList, search).length;
  const visibleGradovi = getVisibleGradovi(cityList, gradovi, expanded, search);
  const hasMore = !search.trim() && !expanded && cityList.length > MAX_VISIBLE;

  const toggleGrad = (grad: string) => {
    if (gradovi.includes(grad)) {
      onGradoviChange(gradovi.filter((g) => g !== grad));
    } else {
      onGradoviChange([...gradovi, grad]);
    }
  };

  const toggleSviGradovi = () => {
    const allSelectedNow = cityList.every((g) => gradovi.includes(g));
    if (allSelectedNow) {
      const set = new Set<string>(cityList);
      onGradoviChange(gradovi.filter((g) => !set.has(g)));
    } else {
      onGradoviChange([...new Set([...gradovi, ...cityList])]);
    }
  };

  return (
    <Card className="bg-muted/50 py-4">
      <CardContent className="flex flex-col gap-0 px-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold">
            {drzava}{" "}
            <span className="text-muted-foreground font-normal">
              ({selectedCount}/{cityList.length})
            </span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="rounded-full"
            onClick={toggleSviGradovi}
          >
            {allSelected ? "Poništi sve" : "Svi gradovi"}
          </Button>
        </div>

        <InputGroup className="mt-4">
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder={`Pretraži gradove — ${drzava}`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setExpanded(false);
            }}
            aria-label={`Pretraga gradova u ${drzava}`}
          />
        </InputGroup>

        {search.trim() && filteredCount === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm italic">
            Nema rezultata za „{search.trim()}”.
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-2">
            {visibleGradovi.map((grad) => (
              <CheckboxTile
                key={grad}
                checked={gradovi.includes(grad)}
                onCheckedChange={() => toggleGrad(grad)}
              >
                {grad}
              </CheckboxTile>
            ))}
          </div>
        )}

        {hasMore ? (
          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full border-dashed"
            onClick={() => setExpanded(true)}
          >
            Prikaži sve ({cityList.length})
          </Button>
        ) : null}

        {!search.trim() && expanded && cityList.length > MAX_VISIBLE ? (
          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full border-dashed"
            onClick={() => setExpanded(false)}
          >
            Prikaži manje
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function MjestaRadaPicker({
  drzave,
  gradovi,
  onDrzaveChange,
  onGradoviChange,
}: MjestaRadaPickerProps) {
  const toggleDrzava = (drzava: Drzava) => {
    if (drzave.includes(drzava)) {
      const nextDrzave = drzave.filter((d) => d !== drzava);
      const allowed = new Set(gradoviZaDrzave(nextDrzave));
      onDrzaveChange(nextDrzave);
      onGradoviChange(gradovi.filter((g) => allowed.has(g)));
    } else {
      onDrzaveChange([...drzave, drzava]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold">Države rada</p>
        <p className="text-muted-foreground mt-1 text-[0.8125rem]">
          Možete izabrati jednu ili više država.
        </p>
        <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-2">
          {DRZAVE.map((drzava) => (
            <CheckboxTile
              key={drzava}
              checked={drzave.includes(drzava)}
              onCheckedChange={() => toggleDrzava(drzava)}
            >
              {drzava}
            </CheckboxTile>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold">Gradovi</p>
        <p className="text-muted-foreground mt-1 text-[0.8125rem]">
          Prikazano je do {MAX_VISIBLE} gradova po državi. Koristite pretragu ili
          „Prikaži sve” za ostale.
        </p>
        {drzave.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm italic">
            Prvo izaberite državu.
          </p>
        ) : (
          <div className="mt-2 flex flex-col gap-6">
            {drzave.map((drzava) => (
              <CityGroup
                key={drzava}
                drzava={drzava}
                gradovi={gradovi}
                onGradoviChange={onGradoviChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
