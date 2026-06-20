import { createClient } from "@/lib/supabase/client";
import type { MjestaRadaJson } from "@/lib/lokacije/types";
import { serializeMjestaRada, validateMjestaRada } from "@/lib/lokacije/utils";
import type { Drzava } from "@/types/database";
import { TIP_CIJENE_OPTIONS, VALUTA_OPTIONS } from "./constants";
import {
  insertUslugaSlike,
  uploadUslugaSlike,
  validateUslugaSlike,
} from "./upload-slike";

export type CreateUslugaPayload = {
  naziv: string;
  informacije: string;
  status: string;
  cijena: number | null;
  tip_cijene: string;
  valuta: string | null;
  kategorija_id: number | null;
  drzave: Drzava[];
  gradovi: string[];
  userUuid: string;
  slike: File[];
};

export type CreateUslugaResult = {
  error?: string;
  uslugaId?: number;
};

export function validateCreatePayload(
  payload: CreateUslugaPayload,
): string | null {
  if (!payload.naziv.trim()) return "Unesite naziv usluge.";
  if (!payload.informacije.trim()) return "Unesite informacije o usluzi.";
  if (!TIP_CIJENE_OPTIONS.includes(payload.tip_cijene as (typeof TIP_CIJENE_OPTIONS)[number])) {
    return "Izaberite tip cijene.";
  }
  if (payload.tip_cijene !== "dogovor") {
    if (payload.cijena != null) {
      if (Number.isNaN(payload.cijena)) return "Cijena nije validna.";
      if (payload.cijena < 0) return "Cijena ne može biti negativna.";
    }
    if (
      payload.valuta != null &&
      !VALUTA_OPTIONS.includes(payload.valuta as (typeof VALUTA_OPTIONS)[number])
    ) {
      return "Izaberite valutu.";
    }
  }

  const mjesta: MjestaRadaJson = {
    drzave: payload.drzave,
    gradovi: payload.gradovi,
  };
  const mjestaError = validateMjestaRada(mjesta);
  if (mjestaError) return mjestaError;

  const slikeError = validateUslugaSlike(payload.slike);
  if (slikeError) return slikeError;

  return null;
}

export async function createUslugaClient(
  korisnikId: number,
  payload: CreateUslugaPayload,
): Promise<CreateUslugaResult> {
  const validationError = validateCreatePayload(payload);
  if (validationError) return { error: validationError };

  const supabase = createClient();
  const mjesta_rada = serializeMjestaRada({
    drzave: payload.drzave,
    gradovi: payload.gradovi,
  });

  const { data: usluga, error: uslugaError } = await supabase
    .from("usluge")
    .insert({
      korisnik_id: korisnikId,
      kategorija_id: payload.kategorija_id,
      naziv: payload.naziv.trim(),
      informacije: payload.informacije.trim(),
      status: payload.status,
      mjesta_rada,
      cijena: payload.cijena,
      tip_cijene: payload.tip_cijene,
      valuta: payload.valuta,
    })
    .select("id")
    .single();

  if (uslugaError) {
    return { error: uslugaError.message };
  }

  if (payload.slike.length === 0) {
    return { uslugaId: usluga.id };
  }

  const { urls, error: uploadError } = await uploadUslugaSlike(
    payload.userUuid,
    usluga.id,
    payload.slike,
  );

  if (uploadError) {
    return {
      error: `Usluga je kreirana, ali slike nisu uploadovane: ${uploadError}`,
      uslugaId: usluga.id,
    };
  }

  const { error: slikeError } = await insertUslugaSlike(usluga.id, urls);

  if (slikeError) {
    return {
      error: `Usluga je kreirana, ali slike nisu sačuvane: ${slikeError}`,
      uslugaId: usluga.id,
    };
  }

  return { uslugaId: usluga.id };
}
