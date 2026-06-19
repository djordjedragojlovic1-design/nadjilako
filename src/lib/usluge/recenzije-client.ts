import { createClient } from "@/lib/supabase/client";
import { compressImageFile } from "./compress-image";
import { USLUGE_SLIKE_BUCKET } from "./constants";

export const KOMENTAR_MAX = 1000;

export type RecenzijaResult = {
  error?: string;
  recenzijaId?: number;
};

function fileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  return "jpg";
}

async function uploadRecenzijaSlika(
  userUuid: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith("image/")) {
    return { error: "Dozvoljeni su samo fajlovi slika." };
  }

  let compressed: File;
  try {
    compressed = await compressImageFile(file);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Kompresija slike nije uspjela.",
    };
  }

  const supabase = createClient();
  const ext = fileExtension(compressed);
  const path = `${userUuid}/recenzije/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(USLUGE_SLIKE_BUCKET)
    .upload(path, compressed, {
      upsert: false,
      contentType: compressed.type,
    });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from(USLUGE_SLIKE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

function validateOcjena(ocjena: number): string | null {
  if (!Number.isInteger(ocjena) || ocjena < 1 || ocjena > 5) {
    return "Izaberite ocjenu od 1 do 5 zvjezdica.";
  }
  return null;
}

export type CreateRecenzijaPayload = {
  uslugaId: number;
  ocjenjivacId: number;
  ocjenjenId: number;
  userUuid: string;
  ocjena: number;
  komentar: string;
  slikaFile: File | null;
};

export async function createRecenzijaClient(
  payload: CreateRecenzijaPayload,
): Promise<RecenzijaResult> {
  const ocjenaError = validateOcjena(payload.ocjena);
  if (ocjenaError) return { error: ocjenaError };

  if (payload.ocjenjivacId === payload.ocjenjenId) {
    return { error: "Ne možete ocijeniti vlastitu uslugu." };
  }

  const komentar = payload.komentar.trim();
  if (komentar.length > KOMENTAR_MAX) {
    return { error: `Komentar može imati najviše ${KOMENTAR_MAX} znakova.` };
  }

  let slika: string | null = null;
  if (payload.slikaFile) {
    const { url, error } = await uploadRecenzijaSlika(
      payload.userUuid,
      payload.slikaFile,
    );
    if (error) return { error };
    slika = url ?? null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("recenzije")
    .insert({
      ocjenjivac_id: payload.ocjenjivacId,
      ocjenjen_id: payload.ocjenjenId,
      usluga_id: payload.uslugaId,
      ocjena: payload.ocjena,
      komentar: komentar || null,
      slika,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Već ste ostavili recenziju za ovu uslugu." };
    }
    return { error: error.message };
  }

  return { recenzijaId: data.id };
}

export type UpdateRecenzijaPayload = {
  recenzijaId: number;
  userUuid: string;
  ocjena: number;
  komentar: string;
  slikaFile: File | null;
  postojecaSlika: string | null;
  ukloniSliku: boolean;
};

export async function updateRecenzijaClient(
  payload: UpdateRecenzijaPayload,
): Promise<RecenzijaResult> {
  const ocjenaError = validateOcjena(payload.ocjena);
  if (ocjenaError) return { error: ocjenaError };

  const komentar = payload.komentar.trim();
  if (komentar.length > KOMENTAR_MAX) {
    return { error: `Komentar može imati najviše ${KOMENTAR_MAX} znakova.` };
  }

  let slika: string | null = payload.postojecaSlika;
  if (payload.ukloniSliku) {
    slika = null;
  }
  if (payload.slikaFile) {
    const { url, error } = await uploadRecenzijaSlika(
      payload.userUuid,
      payload.slikaFile,
    );
    if (error) return { error };
    slika = url ?? null;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("recenzije")
    .update({
      ocjena: payload.ocjena,
      komentar: komentar || null,
      slika,
    })
    .eq("id", payload.recenzijaId);

  if (error) return { error: error.message };
  return { recenzijaId: payload.recenzijaId };
}

export async function deleteRecenzijaClient(
  recenzijaId: number,
): Promise<RecenzijaResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("recenzije")
    .delete()
    .eq("id", recenzijaId);

  if (error) return { error: error.message };
  return { recenzijaId };
}

export type CreateOdgovorPayload = {
  parentId: number;
  uslugaId: number;
  ocjenjivacId: number;
  ocjenjenId: number;
  komentar: string;
};

export async function createOdgovorClient(
  payload: CreateOdgovorPayload,
): Promise<RecenzijaResult> {
  const komentar = payload.komentar.trim();
  if (!komentar) return { error: "Unesite tekst odgovora." };
  if (komentar.length > KOMENTAR_MAX) {
    return { error: `Odgovor može imati najviše ${KOMENTAR_MAX} znakova.` };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("recenzije")
    .insert({
      ocjenjivac_id: payload.ocjenjivacId,
      ocjenjen_id: payload.ocjenjenId,
      usluga_id: payload.uslugaId,
      parent_id: payload.parentId,
      komentar,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { recenzijaId: data.id };
}

export async function deleteOdgovorClient(
  odgovorId: number,
): Promise<RecenzijaResult> {
  return deleteRecenzijaClient(odgovorId);
}
