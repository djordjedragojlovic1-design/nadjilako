"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RazgovorListItem } from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import { RazgovorLista } from "./RazgovorLista";

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
    <div
      className={cn(
        "mx-auto grid min-h-[420px] max-w-6xl overflow-hidden rounded-xl border bg-card shadow-sm",
        "my-6 h-[calc(100dvh-var(--navbar-height)-2rem)]",
        "grid-cols-[minmax(280px,360px)_1fr]",
        "max-md:my-0 max-md:h-[calc(100dvh-var(--navbar-height))] max-md:grid-cols-1 max-md:rounded-none max-md:border-x-0",
      )}
      data-view={isIndex ? "list" : "chat"}
    >
      <aside
        className={cn(
          "flex min-h-0 flex-col border-r",
          !isIndex && "max-md:hidden",
        )}
      >
        <RazgovorLista razgovori={razgovori} activeChatId={activeChatId} />
      </aside>
      <section
        className={cn(
          "flex min-h-0 flex-col",
          isIndex && "max-md:hidden",
        )}
      >
        {children}
      </section>
    </div>
  );
}
