"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RazgovorListItem } from "@/lib/chat/types";
import { RazgovorLista } from "./RazgovorLista";
import styles from "./Chat.module.css";

type ChatShellProps = {
  razgovori: RazgovorListItem[];
  children: ReactNode;
};

function chatIdFromPath(pathname: string): number | null {
  const match = pathname.match(/^\/chat\/(\d+)/);
  return match ? Number(match[1]) : null;
}

export function ChatShell({ razgovori, children }: ChatShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeChatId = useMemo(() => chatIdFromPath(pathname), [pathname]);
  const isIndex = pathname === "/chat";
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const scheduleRefresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), 350);
    };

    const channel = supabase
      .channel("chat-lista")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "poruke" },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <div className={styles.shell} data-view={isIndex ? "list" : "chat"}>
      <aside className={styles.listPane}>
        <RazgovorLista razgovori={razgovori} activeChatId={activeChatId} />
      </aside>
      <section className={styles.contentPane}>{children}</section>
    </div>
  );
}
