import type { Metadata } from "next";
import { Suspense } from "react";
import { PageCard, PageShell } from "@/components/layout/PageShell";
import { AuthCallbackContent } from "./AuthCallbackContent";

export const metadata: Metadata = {
  title: "Potvrda naloga",
  robots: { index: false, follow: false },
};

function AuthCallbackFallback() {
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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
