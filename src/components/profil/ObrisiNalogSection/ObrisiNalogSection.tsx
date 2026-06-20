"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  deleteAccountConfirmed,
  deleteAccountWithPassword,
  requestAccountDeletionEmail,
  signOutAfterDelete,
} from "@/lib/auth/delete-account";

export function ObrisiNalogSection() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetDialog() {
    setPassword("");
    setError(null);
  }

  async function handleDeleteWithPassword() {
    if (!password.trim()) {
      setError("Unesite lozinku za potvrdu brisanja.");
      return;
    }

    setPending(true);
    setError(null);
    setSuccess(null);

    const result = await deleteAccountWithPassword(password);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    await signOutAfterDelete();
    setDialogOpen(false);
    router.replace("/?obrisano=1");
    router.refresh();
  }

  async function handleRequestDeletionEmail() {
    setPendingEmail(true);
    setError(null);
    setSuccess(null);

    const result = await requestAccountDeletionEmail();
    setPendingEmail(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(result.success ?? null);
    setDialogOpen(false);
    resetDialog();
  }

  return (
    <>
      <Separator />

      <section className="space-y-3">
        <p className="text-muted-foreground text-sm">
          Brisanje naloga je trajno. Uklonićemo vaš profil, usluge i povezane
          podatke. Potvrdite lozinkom ili putem linka na email.
        </p>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {success ? (
          <Alert
            className="border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            role="status"
          >
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            resetDialog();
            setSuccess(null);
            setDialogOpen(true);
          }}
        >
          Obriši nalog
        </Button>
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Obriši nalog?</DialogTitle>
            <DialogDescription>
              Ova radnja je nepovratna. Potvrdite lozinkom za brzo brisanje ili
              zatražite link na email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="brisanje-lozinka">Lozinka</Label>
            <Input
              id="brisanje-lozinka"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Unesite trenutnu lozinku"
              disabled={pending || pendingEmail}
            />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => void handleDeleteWithPassword()}
              disabled={pending || pendingEmail}
            >
              {pending ? "Brisanje..." : "Obriši odmah (potvrda lozinkom)"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void handleRequestDeletionEmail()}
              disabled={pending || pendingEmail}
            >
              {pendingEmail ? "Slanje..." : "Pošalji link za potvrdu na email"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setDialogOpen(false)}
              disabled={pending || pendingEmail}
            >
              Odustani
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ObrisiNalogConfirm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);

    const result = await deleteAccountConfirmed();
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    await signOutAfterDelete();
    router.replace("/?obrisano=1");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <p className="text-muted-foreground text-sm">
        Email link je potvrđen. Ova radnja je nepovratna — ukloniće se vaš
        profil, objave, poruke i ostali podaci povezani sa nalogom.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="destructive"
          onClick={() => void handleDelete()}
          disabled={pending}
        >
          {pending ? "Brisanje..." : "Da, obriši nalog trajno"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/uredi-profil")}
          disabled={pending}
        >
          Odustani
        </Button>
      </div>
    </div>
  );
}
