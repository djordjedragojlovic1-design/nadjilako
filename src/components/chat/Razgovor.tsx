"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { AppLink } from "@/components/ui/AppLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
  findOrCreateChat,
  oznaciProcitano,
  posaljiPoruku,
} from "@/lib/chat/client";
import {
  danKljuc,
  formatDanGrupa,
  formatVrijemePoruke,
  getInitials,
} from "@/lib/chat/format";
import {
  PORUKA_MAX,
  mapPorukaRow,
  type ChatUcesnik,
  type ChatUsluga,
  type Poruka,
  type PorukaRow,
} from "@/lib/chat/types";
import { cn } from "@/lib/utils";

type RazgovorProps = {
  chatId: number | null;
  viewerId: number;
  userUuid: string;
  primalacId: number;
  uslugaId: number | null;
  drugiUcesnik: ChatUcesnik;
  usluga: ChatUsluga | null;
  initialPoruke: Poruka[];
};

export function Razgovor({
  chatId,
  viewerId,
  userUuid,
  primalacId,
  uslugaId,
  drugiUcesnik,
  usluga,
  initialPoruke,
}: RazgovorProps) {
  const router = useRouter();
  const [poruke, setPoruke] = useState<Poruka[]>(initialPoruke);
  const [tekst, setTekst] = useState("");
  const [slikaFile, setSlikaFile] = useState<File | null>(null);
  const [slikaPreview, setSlikaPreview] = useState<string | null>(null);
  const [salje, setSalje] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const porukeRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = porukeRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [poruke, scrollToBottom]);

  useEffect(() => {
    if (chatId == null) return;
    void oznaciProcitano(chatId, viewerId).then(() => router.refresh());
  }, [chatId, viewerId, router]);

  useEffect(() => {
    if (chatId == null) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "poruke",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const nova = mapPorukaRow(payload.new as PorukaRow, viewerId);
          setPoruke((prev) =>
            prev.some((p) => p.id === nova.id) ? prev : [...prev, nova],
          );
          if (!nova.odMene) {
            void oznaciProcitano(chatId, viewerId).then(() => router.refresh());
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "poruke",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const izmijenjena = mapPorukaRow(payload.new as PorukaRow, viewerId);
          setPoruke((prev) =>
            prev.map((p) => (p.id === izmijenjena.id ? izmijenjena : p)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, viewerId, router]);

  const onIzaberiSliku = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    if (slikaPreview) URL.revokeObjectURL(slikaPreview);
    if (file) {
      setSlikaFile(file);
      setSlikaPreview(URL.createObjectURL(file));
    } else {
      setSlikaFile(null);
      setSlikaPreview(null);
    }
  };

  const ukloniSliku = () => {
    if (slikaPreview) URL.revokeObjectURL(slikaPreview);
    setSlikaFile(null);
    setSlikaPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const posalji = async () => {
    if (salje) return;
    if (!tekst.trim() && !slikaFile) return;

    setSalje(true);
    setError(null);

    let targetChatId = chatId;
    if (targetChatId == null) {
      const { chatId: noviId, error: greskaChat } = await findOrCreateChat({
        viewerId,
        primalacId,
        uslugaId,
      });
      if (greskaChat || !noviId) {
        setSalje(false);
        setError(greskaChat ?? "Greška pri otvaranju razgovora.");
        return;
      }
      targetChatId = noviId;
    }

    const { poruka, error: greska } = await posaljiPoruku({
      chatId: targetChatId,
      posiljalacId: viewerId,
      userUuid,
      tekst,
      slikaFile,
    });

    setSalje(false);

    if (greska) {
      setError(greska);
      return;
    }

    if (chatId == null) {
      router.replace(`/chat/${targetChatId}`);
      router.refresh();
      return;
    }

    if (poruka) {
      setPoruke((prev) =>
        prev.some((p) => p.id === poruka.id) ? prev : [...prev, poruka],
      );
    }
    setTekst("");
    ukloniSliku();
    router.refresh();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void posalji();
    }
  };

  return (
    <>
      <header className="flex items-center gap-2 border-b px-4 py-2">
        <AppLink
          href="/chat"
          className="hidden size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted max-md:inline-flex"
          aria-label="Nazad"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </AppLink>
        <Avatar className="size-11 shrink-0">
          {drugiUcesnik.profilna_slika ? (
            <AvatarImage src={drugiUcesnik.profilna_slika} alt="" />
          ) : null}
          <AvatarFallback className="font-semibold">
            {getInitials(drugiUcesnik.ime, drugiUcesnik.prezime)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate text-sm">
            <AppLink
              href={`/profil/${drugiUcesnik.id}`}
              className="font-semibold hover:underline"
            >
              @{drugiUcesnik.korisnicko_ime}
            </AppLink>
            {usluga && (
              <>
                <span className="text-muted-foreground"> - </span>
                <AppLink
                  href={`/usluga/${usluga.id}`}
                  className="text-primary hover:underline"
                >
                  {usluga.naziv}
                </AppLink>
              </>
            )}
          </span>
        </span>
      </header>

      <div
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4"
        ref={porukeRef}
      >
        {poruke.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Započnite razgovor — pošaljite prvu poruku.
          </p>
        )}
        {poruke.map((p, i) => {
          const dan = danKljuc(p.sentAt);
          const noviDan =
            i === 0 || dan !== danKljuc(poruke[i - 1]!.sentAt);
          return (
            <div key={p.id} style={{ display: "contents" }}>
              {noviDan && (
                <span className="my-2 self-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {formatDanGrupa(p.sentAt)}
                </span>
              )}
              <div
                className={cn(
                  "flex max-w-[78%]",
                  p.odMene ? "self-end justify-end" : "self-start",
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap",
                    p.odMene
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground",
                  )}
                >
                  {p.slikaUrl && (
                    <a
                      href={p.slikaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image
                        src={p.slikaUrl}
                        alt="Slika u poruci"
                        width={240}
                        height={200}
                        unoptimized
                        className="mb-1 max-h-[280px] max-w-[240px] rounded-md object-cover"
                      />
                    </a>
                  )}
                  {p.poruka && <span>{p.poruka}</span>}
                  <span
                    className={cn(
                      "mt-0.5 flex items-center gap-1 text-[0.68rem] opacity-70",
                      p.odMene && "justify-end",
                    )}
                  >
                    {formatVrijemePoruke(p.sentAt)}
                    {p.odMene && (
                      <span className="font-bold">
                        {p.isRead ? "✓✓" : "✓"}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <Alert variant="destructive" className="mx-4 mb-0 rounded-none border-x-0 border-t-0">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {slikaPreview && (
        <div className="flex items-center gap-2 px-4 pt-2">
          <span className="relative size-14 overflow-hidden rounded-lg border">
            <Image
              src={slikaPreview}
              alt=""
              fill
              sizes="56px"
              unoptimized
              className="object-cover"
            />
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            onClick={ukloniSliku}
            aria-label="Ukloni sliku"
          >
            ×
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2 border-t px-4 py-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onIzaberiSliku}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileRef.current?.click()}
          aria-label="Dodaj sliku"
          disabled={salje}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path
              d="M21 15l-5-5L5 21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
        <Textarea
          className="max-h-[120px] min-h-8 flex-1 resize-none"
          placeholder="Napišite poruku..."
          rows={1}
          value={tekst}
          maxLength={PORUKA_MAX}
          onChange={(e) => setTekst(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <Button
          type="button"
          size="icon"
          onClick={() => void posalji()}
          disabled={salje || (!tekst.trim() && !slikaFile)}
          aria-label="Pošalji"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>
    </>
  );
}
