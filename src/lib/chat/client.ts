import { createClient } from "@/lib/supabase/client";
import { compressImageFile } from "@/lib/usluge/compress-image";
import { USLUGE_SLIKE_BUCKET } from "@/lib/usluge/constants";
import {
  PORUKA_MAX,
  PORUKA_SELECT,
  mapPorukaRow,
  type Poruka,
  type PorukaRow,
} from "./types";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

function fileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  return "jpg";
}

async function uploadChatSlika(
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
  const path = `${userUuid}/chat/${crypto.randomUUID()}.${ext}`;

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

async function findChatId(
  supabase: SupabaseBrowserClient,
  viewerId: number,
  primalacId: number,
  uslugaId: number | null,
): Promise<{ id?: number; error?: string }> {
  let query = supabase
    .from("chat")
    .select("id")
    .or(
      `and(posiljalac_id.eq.${viewerId},primalac_id.eq.${primalacId}),and(posiljalac_id.eq.${primalacId},primalac_id.eq.${viewerId})`,
    );

  query =
    uslugaId == null
      ? query.is("usluga_id", null)
      : query.eq("usluga_id", uslugaId);

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) return { error: error.message };
  return { id: data?.id };
}

export async function findOrCreateChat(params: {
  viewerId: number;
  primalacId: number;
  uslugaId?: number | null;
}): Promise<{ chatId?: number; error?: string }> {
  const { viewerId, primalacId } = params;
  const uslugaId = params.uslugaId ?? null;

  if (viewerId === primalacId) {
    return { error: "Ne možete poslati poruku sami sebi." };
  }

  const supabase = createClient();

  const postojeci = await findChatId(supabase, viewerId, primalacId, uslugaId);
  if (postojeci.error) return { error: postojeci.error };
  if (postojeci.id) return { chatId: postojeci.id };

  const { data, error } = await supabase
    .from("chat")
    .insert({
      posiljalac_id: viewerId,
      primalac_id: primalacId,
      usluga_id: uslugaId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const retry = await findChatId(supabase, viewerId, primalacId, uslugaId);
      if (retry.id) return { chatId: retry.id };
    }
    return { error: error.message };
  }

  return { chatId: data.id };
}

export async function posaljiPoruku(params: {
  chatId: number;
  posiljalacId: number;
  userUuid: string;
  tekst: string;
  slikaFile?: File | null;
}): Promise<{ poruka?: Poruka; error?: string }> {
  const tekst = params.tekst.trim();

  if (!tekst && !params.slikaFile) {
    return { error: "Unesite poruku." };
  }
  if (tekst.length > PORUKA_MAX) {
    return { error: `Poruka može imati najviše ${PORUKA_MAX} znakova.` };
  }

  let slikaUrl: string | null = null;
  if (params.slikaFile) {
    const { url, error } = await uploadChatSlika(
      params.userUuid,
      params.slikaFile,
    );
    if (error) return { error };
    slikaUrl = url ?? null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("poruke")
    .insert({
      chat_id: params.chatId,
      posiljalac_id: params.posiljalacId,
      poruka: tekst || null,
      slika_url: slikaUrl,
    })
    .select(PORUKA_SELECT)
    .single();

  if (error) return { error: error.message };

  return { poruka: mapPorukaRow(data as PorukaRow, params.posiljalacId) };
}

export async function oznaciProcitano(
  chatId: number,
  viewerId: number,
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("poruke")
    .update({ is_read: true })
    .eq("chat_id", chatId)
    .neq("posiljalac_id", viewerId)
    .eq("is_read", false);
}

export async function fetchUnreadCount(viewerId: number): Promise<number> {
  const supabase = createClient();

  const { data: chats, error } = await supabase
    .from("chat")
    .select("id")
    .or(`posiljalac_id.eq.${viewerId},primalac_id.eq.${viewerId}`);

  if (error || !chats || chats.length === 0) return 0;

  const ids = chats.map((c) => c.id);
  const { count } = await supabase
    .from("poruke")
    .select("id", { count: "exact", head: true })
    .in("chat_id", ids)
    .neq("posiljalac_id", viewerId)
    .eq("is_read", false);

  return count ?? 0;
}
