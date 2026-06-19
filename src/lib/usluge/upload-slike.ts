import { createClient } from "@/lib/supabase/client";
import { compressImageFiles } from "./compress-image";
import {
  SLIKE_MAX_COUNT,
  USLUGE_SLIKE_BUCKET,
} from "./constants";

function fileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return mimeMap[file.type] ?? "jpg";
}

export function validateUslugaSlike(
  files: File[],
  existingCount = 0,
): string | null {
  if (files.length + existingCount > SLIKE_MAX_COUNT) {
    return `Možete dodati najviše ${SLIKE_MAX_COUNT} slika.`;
  }

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return "Dozvoljeni su samo fajlovi slika.";
    }
  }

  return null;
}

export async function uploadUslugaSlike(
  userUuid: string,
  uslugaId: number,
  files: File[],
): Promise<{ urls: string[]; error?: string }> {
  if (files.length === 0) return { urls: [] };

  const validationError = validateUslugaSlike(files);
  if (validationError) return { urls: [], error: validationError };

  let compressed: File[];
  try {
    compressed = await compressImageFiles(files);
  } catch (e) {
    return {
      urls: [],
      error: e instanceof Error ? e.message : "Kompresija slike nije uspjela.",
    };
  }

  const supabase = createClient();
  const urls: string[] = [];

  for (const file of compressed) {
    const ext = fileExtension(file);
    const path = `${userUuid}/${uslugaId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(USLUGE_SLIKE_BUCKET)
      .upload(path, file, {
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      return { urls, error: error.message };
    }

    const { data } = supabase.storage
      .from(USLUGE_SLIKE_BUCKET)
      .getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return { urls };
}

export async function insertUslugaSlike(
  uslugaId: number,
  urls: string[],
  startOrder = 0,
): Promise<{ error?: string }> {
  if (urls.length === 0) return {};

  const supabase = createClient();
  const { error } = await supabase.from("slike").insert(
    urls.map((slika_url, index) => ({
      usluga_id: uslugaId,
      slika_url,
      sort_order: startOrder + index,
    })),
  );

  if (error) return { error: error.message };
  return {};
}

export async function deleteUslugaSlike(
  slikaIds: number[],
): Promise<{ error?: string }> {
  if (slikaIds.length === 0) return {};

  const supabase = createClient();
  const { error } = await supabase.from("slike").delete().in("id", slikaIds);

  if (error) return { error: error.message };
  return {};
}
