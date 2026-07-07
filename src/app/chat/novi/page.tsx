import { notFound, redirect } from "next/navigation";
import { Razgovor } from "@/components/chat/Razgovor";
import { fetchChatUsluga, findPostojeciChat } from "@/lib/chat/queries";
import { fetchKorisnikById, getViewerKorisnik } from "@/lib/korisnik/queries";
import type { ChatUsluga } from "@/lib/chat/types";

type NoviRazgovorPageProps = {
  searchParams: Promise<{ korisnik?: string; usluga?: string }>;
};

export default async function NoviRazgovorPage({
  searchParams,
}: NoviRazgovorPageProps) {
  const { korisnik: korisnikParam, usluga: uslugaParam } = await searchParams;

  const primalacId = Number(korisnikParam);
  if (Number.isNaN(primalacId)) {
    notFound();
  }

  const uslugaId =
    uslugaParam && !Number.isNaN(Number(uslugaParam))
      ? Number(uslugaParam)
      : null;

  const viewer = await getViewerKorisnik();
  if (!viewer) {
    const next = `/chat/novi?korisnik=${primalacId}${
      uslugaId ? `&usluga=${uslugaId}` : ""
    }`;
    redirect(`/prijava?next=${encodeURIComponent(next)}`);
  }

  if (viewer.id === primalacId) {
    redirect(`/profil/${primalacId}`);
  }

  const postojeci = await findPostojeciChat(viewer.id, primalacId, uslugaId);
  if (postojeci) {
    redirect(`/chat/${postojeci}`);
  }

  const drugi = await fetchKorisnikById(primalacId);
  if (!drugi) {
    notFound();
  }

  let usluga: ChatUsluga | null = null;
  if (uslugaId != null) {
    usluga = await fetchChatUsluga(uslugaId);
  }

  return (
    <Razgovor
      chatId={null}
      viewerId={viewer.id}
      userUuid={viewer.user_uuid}
      primalacId={primalacId}
      uslugaId={uslugaId}
      drugiUcesnik={{
        id: drugi.id,
        ime: drugi.ime,
        prezime: drugi.prezime,
        korisnicko_ime: drugi.korisnicko_ime,
        profilna_slika: drugi.profilna_slika,
      }}
      usluga={usluga}
      initialPoruke={[]}
    />
  );
}
