import { DRZAVE, type Drzava } from "@/types/database";
import type { MjestaRadaJson } from "./types";
import { PRAZNA_MJESTA_RADA } from "./types";
import { drzavaZaGrad, gradoviZaDrzave } from "./gradovi";

export function parseMjestaRada(
  raw: string | MjestaRadaJson | Record<string, unknown> | null | undefined,
): MjestaRadaJson {
  if (!raw) return { ...PRAZNA_MJESTA_RADA };

  if (typeof raw === "object" && !Array.isArray(raw)) {
    const drzave = Array.isArray(raw.drzave)
      ? raw.drzave.filter((d): d is Drzava =>
          typeof d === "string" && (DRZAVE as readonly string[]).includes(d),
        )
      : [];
    const gradovi = Array.isArray(raw.gradovi)
      ? raw.gradovi.filter((g): g is string => typeof g === "string")
      : [];
    return { drzave, gradovi };
  }

  if (typeof raw === "string") {
    try {
      return parseMjestaRada(JSON.parse(raw) as Record<string, unknown>);
    } catch {
      return { drzave: [], gradovi: raw ? [raw] : [] };
    }
  }

  return { ...PRAZNA_MJESTA_RADA };
}

export function serializeMjestaRada(mjesta: MjestaRadaJson): MjestaRadaJson {
  const drzave = [...new Set(mjesta.drzave)];
  const gradovi = [...new Set(mjesta.gradovi)].filter((g) => {
    const d = drzavaZaGrad(g);
    return !d || drzave.includes(d);
  });
  return { drzave, gradovi };
}

export function validateMjestaRada(mjesta: MjestaRadaJson): string | null {
  if (mjesta.drzave.length === 0) {
    return "Izaberite barem jednu državu.";
  }
  if (mjesta.gradovi.length === 0) {
    return "Izaberite barem jedan grad.";
  }
  const allowed = new Set(gradoviZaDrzave(mjesta.drzave));
  const invalid = mjesta.gradovi.filter((g) => !allowed.has(g));
  if (invalid.length > 0) {
    return "Neki gradovi ne pripadaju izabranim državama.";
  }
  return null;
}
