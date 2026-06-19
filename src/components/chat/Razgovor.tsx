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
import styles from "./Chat.module.css";

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

  // Označi pristigle poruke kao pročitane + osvježi listu (badge).
  useEffect(() => {
    if (chatId == null) return;
    void oznaciProcitano(chatId, viewerId).then(() => router.refresh());
  }, [chatId, viewerId, router]);

  // Realtime: nove poruke i izmjene (status pročitano).
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

    // Novi razgovor — kreiraj ga tek sada (pri prvoj poruci).
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

    // Ako je ovo bio novi razgovor, preusmjeri na njegovu stranicu.
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

  let prethodniDan = "";

  return (
    <>
      <header className={styles.chatHeader}>
        <AppLink href="/chat" className={styles.backBtn} aria-label="Nazad">
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
        <span className={styles.avatar}>
          {drugiUcesnik.profilna_slika ? (
            <Image
              src={drugiUcesnik.profilna_slika}
              alt=""
              fill
              sizes="44px"
              className={styles.avatarImg}
            />
          ) : (
            getInitials(drugiUcesnik.ime, drugiUcesnik.prezime)
          )}
        </span>
        <span className={styles.chatHeaderInfo}>
          <span className={styles.chatHeaderTitle}>
            <AppLink
              href={`/profil/${drugiUcesnik.id}`}
              className={styles.chatHeaderName}
            >
              @{drugiUcesnik.korisnicko_ime}
            </AppLink>
            {usluga && (
              <>
                <span className={styles.chatHeaderSep}> - </span>
                <AppLink
                  href={`/usluga/${usluga.id}`}
                  className={styles.chatHeaderUsluga}
                >
                  {usluga.naziv}
                </AppLink>
              </>
            )}
          </span>
        </span>
      </header>

      <div className={styles.poruke} ref={porukeRef}>
        {poruke.length === 0 && (
          <p className={styles.empty}>
            Započnite razgovor — pošaljite prvu poruku.
          </p>
        )}
        {poruke.map((p) => {
          const dan = danKljuc(p.sentAt);
          const noviDan = dan !== prethodniDan;
          prethodniDan = dan;
          return (
            <div key={p.id} style={{ display: "contents" }}>
              {noviDan && (
                <span className={styles.dan}>{formatDanGrupa(p.sentAt)}</span>
              )}
              <div
                className={`${styles.bubbleRow} ${
                  p.odMene ? styles.bubbleRowMine : styles.bubbleRowTheirs
                }`}
              >
                <div
                  className={`${styles.bubble} ${
                    p.odMene ? styles.bubbleMine : styles.bubbleTheirs
                  }`}
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
                        className={styles.bubbleImg}
                      />
                    </a>
                  )}
                  {p.poruka && <span>{p.poruka}</span>}
                  <span
                    className={`${styles.bubbleMeta} ${
                      p.odMene ? styles.bubbleMineMeta : ""
                    }`}
                  >
                    {formatVrijemePoruke(p.sentAt)}
                    {p.odMene && (
                      <span className={styles.readTick}>
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

      {error && <p className={styles.error}>{error}</p>}

      {slikaPreview && (
        <div className={styles.previewBar}>
          <span className={styles.previewThumb}>
            <Image
              src={slikaPreview}
              alt=""
              fill
              sizes="56px"
              unoptimized
              className={styles.previewImg}
            />
          </span>
          <button
            type="button"
            className={styles.previewRemove}
            onClick={ukloniSliku}
            aria-label="Ukloni sliku"
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.composer}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onIzaberiSliku}
        />
        <button
          type="button"
          className={styles.iconBtn}
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
        </button>
        <textarea
          className={styles.composerInput}
          placeholder="Napišite poruku..."
          rows={1}
          value={tekst}
          maxLength={PORUKA_MAX}
          onChange={(e) => setTekst(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className={styles.sendBtn}
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
        </button>
      </div>
    </>
  );
}
