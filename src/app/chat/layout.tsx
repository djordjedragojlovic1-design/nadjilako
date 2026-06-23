import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ChatShell } from "@/components/chat/ChatShell";
import { fetchRazgovori } from "@/lib/chat/queries";
import { getViewerKorisnik } from "@/lib/korisnik/queries";

export const metadata: Metadata = {
  title: "Poruke",
  robots: { index: false, follow: false },
};

export default async function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  const viewer = await getViewerKorisnik();
  if (!viewer) {
    redirect("/prijava?next=/chat");
  }

  const razgovori = await fetchRazgovori(viewer.id);

  return <ChatShell razgovori={razgovori}>{children}</ChatShell>;
}
