"use client";

import { useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { mapAuthError } from "@/lib/auth/messages";
import { getSiteOrigin } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type VerifikacijaPanelProps = {
  korisnikId: number;
  email: string;
  emailVerifikovan: boolean;
  brojTelefona: string | null;
  telefonVerifikovan: boolean;
};

function StatusBadge({ verifikovan }: { verifikovan: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 font-bold",
        verifikovan
          ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-destructive/35 bg-destructive/10 text-destructive",
      )}
    >
      {verifikovan ? "Verifikovano" : "Nije verifikovano"}
    </Badge>
  );
}

export function VerifikacijaPanel({
  email,
  emailVerifikovan,
  brojTelefona,
  telefonVerifikovan,
}: VerifikacijaPanelProps) {
  const [emailPending, setEmailPending] = useState(false);
  const [emailPoruka, setEmailPoruka] = useState<string | null>(null);
  const [emailGreska, setEmailGreska] = useState<string | null>(null);

  async function posaljiEmailPonovo() {
    setEmailPending(true);
    setEmailPoruka(null);
    setEmailGreska(null);

    const supabase = createClient();
    const origin = getSiteOrigin(window.location.origin);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });

    if (error) {
      setEmailGreska(mapAuthError(error.message));
    } else {
      setEmailPoruka(
        "Poslali smo verifikacioni link na vašu email adresu. Provjerite inbox i spam.",
      );
    }
    setEmailPending(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold">Email adresa</h2>
            <p className="text-muted-foreground mt-1 break-all text-sm">
              {email || "—"}
            </p>
          </div>
          <StatusBadge verifikovan={emailVerifikovan} />
        </div>

        {emailGreska && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{emailGreska}</AlertDescription>
          </Alert>
        )}
        {emailPoruka && (
          <Alert
            className="border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            role="status"
          >
            <AlertDescription>{emailPoruka}</AlertDescription>
          </Alert>
        )}

        {emailVerifikovan ? (
          <p className="text-muted-foreground text-sm">
            Vaša email adresa je potvrđena.
          </p>
        ) : (
          <Button
            type="button"
            className="self-start"
            onClick={posaljiEmailPonovo}
            disabled={emailPending}
          >
            {emailPending ? "Slanje..." : "Pošalji verifikacioni email"}
          </Button>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold">Broj telefona</h2>
            <p className="text-muted-foreground mt-1 break-all text-sm">
              {brojTelefona || "—"}
            </p>
          </div>
          {brojTelefona && telefonVerifikovan && (
            <StatusBadge verifikovan />
          )}
        </div>

        {!brojTelefona ? (
          <p className="text-muted-foreground text-sm">
            Niste unijeli broj telefona. Dodajte ga na stranici{" "}
            <AppLink
              href="/uredi-profil"
              className="text-primary font-semibold hover:underline"
            >
              Uredi profil
            </AppLink>
            .
          </p>
        ) : telefonVerifikovan ? (
          <p className="text-muted-foreground text-sm">
            Vaš broj telefona je potvrđen.
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Verifikacija broja telefona trenutno nije moguća u ovoj fazi.
            Uvešćemo je naknadno.
          </p>
        )}
      </div>

      <p className="text-muted-foreground text-center text-sm">
        <AppLink
          href="/uredi-profil"
          className="text-primary font-semibold hover:underline"
        >
          Nazad na uređivanje profila
        </AppLink>
      </p>
    </div>
  );
}
