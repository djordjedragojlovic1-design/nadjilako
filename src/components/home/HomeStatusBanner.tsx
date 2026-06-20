"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";

type HomeStatusBannerProps = {
  uspjeh?: string;
  obrisano?: string;
};

export function HomeStatusBanner({ uspjeh, obrisano }: HomeStatusBannerProps) {
  if (obrisano === "1") {
    return (
      <Alert
        className="mb-6 border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        role="status"
      >
        <AlertDescription>Vaš nalog je uspješno obrisan.</AlertDescription>
      </Alert>
    );
  }

  if (uspjeh === "email") {
    return (
      <Alert
        className="mb-6 border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        role="status"
      >
        <AlertDescription>
          Email adresa je potvrđena. Dobrodošli na NadjiLako!
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
