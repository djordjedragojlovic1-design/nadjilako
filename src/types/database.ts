import type { MjestaRadaJson } from "@/lib/lokacije/types";

export const DRZAVE = [
  "Bosna i Hercegovina",
  "Srbija",
  "Hrvatska",
  "Crna Gora",
] as const;

export type Drzava = (typeof DRZAVE)[number];

export type Korisnik = {
  id: number;
  user_uuid: string;
  ime: string;
  prezime: string;
  korisnicko_ime: string;
  profilna_slika: string | null;
  inf_o_korisniku: string | null;
  drzava: Drzava;
  broj_telefona: string | null;
  telefon_verifikovan: boolean;
  krediti: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type Usluga = {
  id: number;
  korisnik_id: number;
  kategorija_id: number | null;
  tip: string | null;
  promocija: string | null;
  promovisano_do: string | null;
  promovisano_od: string | null;
  naziv: string;
  informacije: string | null;
  status: string;
  mjesta_rada: MjestaRadaJson | null;
  cijena: number | null;
  tip_cijene: string | null;
  valuta: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
};

export type KreditTransakcija = {
  id: number;
  korisnik_id: number;
  tip: "kupovina" | "promocija" | "povrat" | "admin";
  iznos: number;
  saldo_poslije: number;
  opis: string | null;
  usluga_id: number | null;
  created_at: string;
};

export type Chat = {
  id: number;
  usluga_id: number | null;
  posiljalac_id: number;
  primalac_id: number;
  created_at: string;
  last_message_at: string;
};

export type Poruka = {
  id: number;
  chat_id: number;
  posiljalac_id: number;
  poruka: string | null;
  slika_url: string | null;
  is_read: boolean;
  sent_at: string;
};

export type Pratilac = {
  id: number;
  korisnik_id: number;
  pratilac_id: number;
  created_at: string;
};

export type SacuvanaObjava = {
  id: number;
  korisnik_id: number;
  usluga_id: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      korisnik: {
        Row: Korisnik;
        Insert: {
          user_uuid: string;
          ime: string;
          prezime: string;
          korisnicko_ime: string;
          drzava: string;
          profilna_slika?: string | null;
          inf_o_korisniku?: string | null;
          broj_telefona?: string | null;
          telefon_verifikovan?: boolean;
          krediti?: number;
          is_active?: boolean;
          is_verified?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["korisnik"]["Insert"]>;
        Relationships: [];
      };
      usluge: {
        Row: Usluga;
        Insert: {
          korisnik_id: number;
          kategorija_id?: number | null;
          tip?: string | null;
          promocija?: string | null;
          promovisano_do?: string | null;
          promovisano_od?: string | null;
          naziv: string;
          informacije?: string | null;
          status?: string;
          mjesta_rada?: MjestaRadaJson | null;
          cijena?: number | null;
          tip_cijene?: string | null;
          valuta?: string | null;
          expires_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["usluge"]["Insert"]>;
        Relationships: [];
      };
      slike: {
        Row: {
          id: number;
          usluga_id: number;
          slika_url: string;
          sort_order: number | null;
          uploaded_at: string;
        };
        Insert: {
          usluga_id: number;
          slika_url: string;
          sort_order?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["slike"]["Insert"]>;
        Relationships: [];
      };
      kategorije: {
        Row: {
          id: number;
          parent_id: number | null;
          naziv: string;
          slug: string | null;
        };
        Insert: {
          naziv: string;
          parent_id?: number | null;
          slug?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["kategorije"]["Insert"]>;
        Relationships: [];
      };
      recenzije: {
        Row: {
          id: number;
          ocjenjivac_id: number;
          ocjenjen_id: number;
          usluga_id: number | null;
          parent_id: number | null;
          ocjena: number | null;
          komentar: string | null;
          slika: string | null;
          created_at: string;
        };
        Insert: {
          ocjenjivac_id: number;
          ocjenjen_id: number;
          usluga_id?: number | null;
          parent_id?: number | null;
          ocjena?: number | null;
          komentar?: string | null;
          slika?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["recenzije"]["Insert"]>;
        Relationships: [];
      };
      chat: {
        Row: Chat;
        Insert: {
          posiljalac_id: number;
          primalac_id: number;
          usluga_id?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["chat"]["Insert"]>;
        Relationships: [];
      };
      poruke: {
        Row: Poruka;
        Insert: {
          chat_id: number;
          posiljalac_id: number;
          poruka?: string | null;
          slika_url?: string | null;
          is_read?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["poruke"]["Insert"]>;
        Relationships: [];
      };
      kredit_transakcije: {
        Row: KreditTransakcija;
        Insert: {
          korisnik_id: number;
          tip: KreditTransakcija["tip"];
          iznos: number;
          saldo_poslije: number;
          opis?: string | null;
          usluga_id?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["kredit_transakcije"]["Insert"]>;
        Relationships: [];
      };
      pratioci: {
        Row: Pratilac;
        Insert: {
          korisnik_id: number;
          pratilac_id: number;
        };
        Update: Partial<Database["public"]["Tables"]["pratioci"]["Insert"]>;
        Relationships: [];
      };
      sacuvane_objave: {
        Row: SacuvanaObjava;
        Insert: {
          korisnik_id: number;
          usluga_id: number;
        };
        Update: Partial<Database["public"]["Tables"]["sacuvane_objave"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      kupi_kredite: {
        Args: { p_iznos: number };
        Returns: number;
      };
      promovisi_uslugu: {
        Args: { p_usluga_id: number; p_tip: string; p_dana?: number };
        Returns: number;
      };
      broj_pratilaca: {
        Args: { p_korisnik_id: number };
        Returns: number;
      };
      broj_pracenih: {
        Args: { p_korisnik_id: number };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
