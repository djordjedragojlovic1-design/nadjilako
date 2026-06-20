import { Suspense } from "react";
import { PageCard, PageShell } from "@/components/layout/PageShell";
import { AuthCallbackContent } from "./AuthCallbackContent";

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
