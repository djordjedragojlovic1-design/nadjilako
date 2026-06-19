export type ChatUcesnik = {
  id: number;
  ime: string;
  prezime: string;
  korisnicko_ime: string;
  profilna_slika: string | null;
};

export type ChatUsluga = {
  id: number;
  naziv: string;
};

export type PoslednjaPoruka = {
  tekst: string | null;
  imaSliku: boolean;
  sentAt: string;
  odMene: boolean;
};

export type RazgovorListItem = {
  id: number;
  usluga: ChatUsluga | null;
  drugiUcesnik: ChatUcesnik;
  poslednjaPoruka: PoslednjaPoruka | null;
  brojNeprocitanih: number;
  lastMessageAt: string;
};

export type Poruka = {
  id: number;
  chatId: number;
  posiljalacId: number;
  poruka: string | null;
  slikaUrl: string | null;
  isRead: boolean;
  sentAt: string;
  odMene: boolean;
};

export type ChatMeta = {
  id: number;
  drugiUcesnik: ChatUcesnik;
  usluga: ChatUsluga | null;
};

export const PORUKA_MAX = 2000;

export const CHAT_UCESNIK_SELECT =
  "id, ime, prezime, korisnicko_ime, profilna_slika";

export const PORUKA_SELECT =
  "id, chat_id, posiljalac_id, poruka, slika_url, is_read, sent_at";

export type PorukaRow = {
  id: number;
  chat_id: number;
  posiljalac_id: number;
  poruka: string | null;
  slika_url: string | null;
  is_read: boolean;
  sent_at: string;
};

export function mapPorukaRow(row: PorukaRow, viewerId: number): Poruka {
  return {
    id: row.id,
    chatId: row.chat_id,
    posiljalacId: row.posiljalac_id,
    poruka: row.poruka,
    slikaUrl: row.slika_url,
    isRead: row.is_read,
    sentAt: row.sent_at,
    odMene: row.posiljalac_id === viewerId,
  };
}
