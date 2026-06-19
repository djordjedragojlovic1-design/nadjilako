import type { Drzava } from "@/types/database";

export type MjestaRadaJson = {
  drzave: Drzava[];
  gradovi: string[];
};

export const PRAZNA_MJESTA_RADA: MjestaRadaJson = {
  drzave: [],
  gradovi: [],
};
