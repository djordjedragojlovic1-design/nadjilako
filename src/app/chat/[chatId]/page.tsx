import { notFound, redirect } from "next/navigation";
import { Razgovor } from "@/components/chat/Razgovor";
import { fetchChatMeta, fetchPoruke } from "@/lib/chat/queries";
import { getViewerKorisnik } from "@/lib/korisnik/queries";

type ChatRazgovorPageProps = {
  params: Promise<{ chatId: string }>;
};

export default async function ChatRazgovorPage({
  params,
}: ChatRazgovorPageProps) {
  const { chatId: chatIdParam } = await params;
  const chatId = Number(chatIdParam);

  if (Number.isNaN(chatId)) {
    notFound();
  }

  const viewer = await getViewerKorisnik();
  if (!viewer) {
    redirect(`/prijava?next=/chat/${chatId}`);
  }

  const meta = await fetchChatMeta(chatId, viewer.id);
  if (!meta) {
    notFound();
  }

  const poruke = await fetchPoruke(chatId, viewer.id);

  return (
    <Razgovor
      chatId={chatId}
      viewerId={viewer.id}
      userUuid={viewer.user_uuid}
      primalacId={meta.drugiUcesnik.id}
      uslugaId={meta.usluga?.id ?? null}
      drugiUcesnik={meta.drugiUcesnik}
      usluga={meta.usluga}
      initialPoruke={poruke}
    />
  );
}
