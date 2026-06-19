import { createClient } from "@/lib/supabase/server";
import {
  CHAT_UCESNIK_SELECT,
  PORUKA_SELECT,
  mapPorukaRow,
  type ChatMeta,
  type ChatUcesnik,
  type ChatUsluga,
  type Poruka,
  type PorukaRow,
  type RazgovorListItem,
} from "./types";

type ChatRow = {
  id: number;
  usluga_id: number | null;
  posiljalac_id: number;
  primalac_id: number;
  created_at: string;
  last_message_at: string;
  posiljalac: ChatUcesnik | null;
  primalac: ChatUcesnik | null;
  usluga: ChatUsluga | null;
};

function chatSelect(): string {
  return `
    id,
    usluga_id,
    posiljalac_id,
    primalac_id,
    created_at,
    last_message_at,
    posiljalac:posiljalac_id ( ${CHAT_UCESNIK_SELECT} ),
    primalac:primalac_id ( ${CHAT_UCESNIK_SELECT} ),
    usluga:usluga_id ( id, naziv )
  `;
}

function drugiUcesnik(row: ChatRow, viewerId: number): ChatUcesnik {
  const drugi = row.posiljalac_id === viewerId ? row.primalac : row.posiljalac;
  return (
    drugi ?? {
      id: 0,
      ime: "Nepoznat",
      prezime: "korisnik",
      korisnicko_ime: "nepoznato",
      profilna_slika: null,
    }
  );
}

export async function fetchRazgovori(
  viewerId: number,
): Promise<RazgovorListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chat")
    .select(chatSelect())
    .or(`posiljalac_id.eq.${viewerId},primalac_id.eq.${viewerId}`)
    .order("last_message_at", { ascending: false });

  if (error) throw error;

  const chats = (data ?? []) as unknown as ChatRow[];
  if (chats.length === 0) return [];

  const chatIds = chats.map((c) => c.id);
  const { data: porukeData, error: porukeError } = await supabase
    .from("poruke")
    .select(PORUKA_SELECT)
    .in("chat_id", chatIds)
    .order("sent_at", { ascending: false });

  if (porukeError) throw porukeError;

  const poruke = (porukeData ?? []) as PorukaRow[];

  const poslednjaPoChatu = new Map<number, PorukaRow>();
  const neprocitanoPoChatu = new Map<number, number>();
  for (const p of poruke) {
    if (!poslednjaPoChatu.has(p.chat_id)) {
      poslednjaPoChatu.set(p.chat_id, p);
    }
    if (!p.is_read && p.posiljalac_id !== viewerId) {
      neprocitanoPoChatu.set(
        p.chat_id,
        (neprocitanoPoChatu.get(p.chat_id) ?? 0) + 1,
      );
    }
  }

  return chats.map((c) => {
    const last = poslednjaPoChatu.get(c.id) ?? null;
    return {
      id: c.id,
      usluga: c.usluga,
      drugiUcesnik: drugiUcesnik(c, viewerId),
      poslednjaPoruka: last
        ? {
            tekst: last.poruka,
            imaSliku: last.slika_url != null,
            sentAt: last.sent_at,
            odMene: last.posiljalac_id === viewerId,
          }
        : null,
      brojNeprocitanih: neprocitanoPoChatu.get(c.id) ?? 0,
      lastMessageAt: c.last_message_at,
    };
  });
}

export async function fetchChatMeta(
  chatId: number,
  viewerId: number,
): Promise<ChatMeta | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chat")
    .select(chatSelect())
    .eq("id", chatId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const c = data as unknown as ChatRow;
  if (c.posiljalac_id !== viewerId && c.primalac_id !== viewerId) {
    return null;
  }

  return {
    id: c.id,
    drugiUcesnik: drugiUcesnik(c, viewerId),
    usluga: c.usluga,
  };
}

export async function findPostojeciChat(
  viewerId: number,
  primalacId: number,
  uslugaId: number | null,
): Promise<number | null> {
  const supabase = await createClient();

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
  if (error) throw error;
  return data?.id ?? null;
}

export async function fetchChatUsluga(
  uslugaId: number,
): Promise<ChatUsluga | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("usluge")
    .select("id, naziv")
    .eq("id", uslugaId)
    .maybeSingle();

  if (error) throw error;
  return (data as ChatUsluga | null) ?? null;
}

export async function fetchPoruke(
  chatId: number,
  viewerId: number,
): Promise<Poruka[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("poruke")
    .select(PORUKA_SELECT)
    .eq("chat_id", chatId)
    .order("sent_at", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as PorukaRow[]).map((p) => mapPorukaRow(p, viewerId));
}
