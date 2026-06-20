"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { PageCard, PageShell } from "@/components/layout/PageShell";
import { establishSessionFromCallbackParams } from "@/lib/auth/callback-session";
import { ensureKorisnikProfileForUser } from "@/lib/auth/ensure-profile";
import { createClient } from "@/lib/supabase/client";

export function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    async function completeAuth() {
      const supabase = createClient();
      const next = searchParams.get("next") ?? "/";
      const isDeleteFlow = next.startsWith("/obrisi-nalog");
      const successUrl = isDeleteFlow
        ? next
        : next === "/"
          ? "/?uspjeh=email"
          : `${next}${next.includes("?") ? "&" : "?"}uspjeh=email`;

      const sessionResult = await establishSessionFromCallbackParams(supabase, {
        code: searchParams.get("code"),
        token_hash: searchParams.get("token_hash"),
        type: searchParams.get("type"),
      });

      if (cancelled) return;

      if (!sessionResult.ok) {
        router.replace("/prijava?greska=potvrda");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error: profileError } = await ensureKorisnikProfileForUser(
          supabase,
          user,
        );
        if (profileError) {
          router.replace(
            `/prijava?greska=profil&poruka=${encodeURIComponent(profileError)}`,
          );
          return;
        }
      }

      router.replace(successUrl);
    }

    void completeAuth().catch(() => {
      if (!cancelled) {
        router.replace("/prijava?greska=potvrda");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <PageShell>
      <PageCard narrow>
        <p className="text-muted-foreground text-center text-sm">
          Potvrđujemo vaš nalog...
        </p>
      </PageCard>
    </PageShell>
  );
}
