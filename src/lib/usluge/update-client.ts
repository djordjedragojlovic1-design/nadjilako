import { createClient } from "@/lib/supabase/client";
import type { MjestaRadaJson } from "@/lib/lokacije/types";
import { serializeMjestaRada, validateMjestaRada } from "@/lib/lokacije/utils";
import type { Drzava } from "@/types/database";
import { TIP_CIJENE_OPTIONS, VALUTA_OPTIONS } from "./constants";
import {
  deleteUslugaSlike,
  insertUslugaSlike,
  uploadUslugaSlike,
  validateUslugaSlike,
} from "./upload-slike";

export type UpdateUslugaPayload = {
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
  noveSlike: File[];
  zadrzaneSlikaIds: number[];
  uklonjeneSlikaIds: number[];
};

export type UpdateUslugaResult = {
  error?: string;
  uslugaId?: number;
};

export function validateUpdatePayload(
  payload: UpdateUslugaPayload,
): string | null {
  if (!payload.naziv.trim()) return "Unesite naziv usluge.";
  if (!payload.informacije.trim()) return "Unesite informacije o usluzi.";
  if (!TIP_CIJENE_OPTIONS.includes(payload.tip_cijene as (typeof TIP_CIJENE_OPTIONS)[number])) {
    return "Izaberite tip cijene.";
  }
  if (payload.tip_cijene !== "dogovor") {
    if (payload.cijena == null || Number.isNaN(payload.cijena)) {
      return "Unesite cijenu.";
    }
    if (payload.cijena < 0) return "Cijena ne može biti negativna.";
    if (!VALUTA_OPTIONS.includes(payload.valuta as (typeof VALUTA_OPTIONS)[number])) {
      return "Izaberite valutu.";
    }
  }

  const mjesta: MjestaRadaJson = {
    drzave: payload.drzave,
    gradovi: payload.gradovi,
  };
  const mjestaError = validateMjestaRada(mjesta);
  if (mjestaError) return mjestaError;

  const slikeError = validateUslugaSlike(
    payload.noveSlike,
    payload.zadrzaneSlikaIds.length,
  );
  if (slikeError) return slikeError;

  return null;
}

export async function updateUslugaClient(
  korisnikId: number,
  uslugaId: number,
  payload: UpdateUslugaPayload,
): Promise<UpdateUslugaResult> {
  const validationError = validateUpdatePayload(payload);
  if (validationError) return { error: validationError };

  const supabase = createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("usluge")
    .select("korisnik_id")
    .eq("id", uslugaId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!existing) return { error: "Usluga nije pronađena." };
  if (existing.korisnik_id !== korisnikId) {
    return { error: "Nemate dozvolu za uređivanje ove usluge." };
  }

  const mjesta_rada = serializeMjestaRada({
    drzave: payload.drzave,
    gradovi: payload.gradovi,
  });

  const { error: uslugaError } = await supabase
    .from("usluge")
    .update({
      kategorija_id: payload.kategorija_id,
      naziv: payload.naziv.trim(),
      informacije: payload.informacije.trim(),
      status: payload.status,
      mjesta_rada,
      cijena: payload.cijena,
      tip_cijene: payload.tip_cijene,
      valuta: payload.valuta,
    })
    .eq("id", uslugaId);

  if (uslugaError) {
    return { error: uslugaError.message };
  }

  if (payload.uklonjeneSlikaIds.length > 0) {
    const { error: deleteError } = await deleteUslugaSlike(payload.uklonjeneSlikaIds);
    if (deleteError) {
      return {
        error: `Usluga je ažurirana, ali uklanjanje slika nije uspjelo: ${deleteError}`,
        uslugaId,
      };
    }
  }

  if (payload.noveSlike.length > 0) {
    const { urls, error: uploadError } = await uploadUslugaSlike(
      payload.userUuid,
      uslugaId,
      payload.noveSlike,
    );

    if (uploadError) {
      return {
        error: `Usluga je ažurirana, ali nove slike nisu uploadovane: ${uploadError}`,
        uslugaId,
      };
    }

    const { error: insertError } = await insertUslugaSlike(
      uslugaId,
      urls,
      payload.zadrzaneSlikaIds.length,
    );

    if (insertError) {
      return {
        error: `Usluga je ažurirana, ali nove slike nisu sačuvane: ${insertError}`,
        uslugaId,
      };
    }
  }

  return { uslugaId };
}
