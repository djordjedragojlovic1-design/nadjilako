"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInClient } from "@/lib/auth/client-actions";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const result = await signInClient(formData);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    router.refresh();
    router.push("/");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="vas@email.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lozinka">Lozinka</Label>
        <Input
          id="lozinka"
          name="lozinka"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Prijava..." : "Prijavi se"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Nemate nalog?{" "}
        <AppLink href="/registracija" className="text-primary font-semibold hover:underline">
          Registrujte se
        </AppLink>
      </p>
    </form>
  );
}
