import { createClient } from "@/lib/supabase/client";
import type { PromoTip } from "./constants";

export type KreditRezultat = {
  error?: string;
  saldo?: number;
};

/**
 * Prevod poznatih grešaka iz Postgres funkcija u poruke na srpskom.
 * Funkcije već vraćaju srpski tekst, ali Supabase ponekad doda prefiks.
 */
function prevodGreske(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("nemate dovoljno kredita")) return "Nemate dovoljno kredita.";
  if (m.includes("niste prijavljeni")) return "Niste prijavljeni.";
  if (m.includes("niste vlasnik")) return "Niste vlasnik ove usluge.";
  if (m.includes("usluga ne postoji")) return "Usluga ne postoji.";
  if (m.includes("neispravan tip")) return "Neispravan tip promocije.";
  if (m.includes("neispravan paket")) return "Neispravan paket kredita.";
  if (m.includes("promocija je još aktivna")) {
    return "Promocija je još aktivna. Sačekajte da istekne prije nove promocije.";
  }
  // Ako funkcija vrati čistu poruku, prikaži je kako jeste.
  return message.replace(/^.*?:\s*/, "") || "Došlo je do greške.";
}

/** Kupovina paketa kredita (simulirano plaćanje). Vraća novo stanje. */
export async function kupiKrediteClient(iznos: number): Promise<KreditRezultat> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("kupi_kredite", { p_iznos: iznos });
  if (error) return { error: prevodGreske(error.message) };
  return { saldo: data as number };
}

/** Promovisanje usluge (moguće samo kad nema aktivne promocije). Vraća novo stanje kredita. */
export async function promovisiUsluguClient(
  uslugaId: number,
  tip: PromoTip,
): Promise<KreditRezultat> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("promovisi_uslugu", {
    p_usluga_id: uslugaId,
    p_tip: tip,
  });
  if (error) return { error: prevodGreske(error.message) };
  return { saldo: data as number };
}
