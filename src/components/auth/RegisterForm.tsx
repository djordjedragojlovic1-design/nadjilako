"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signUpClient } from "@/lib/auth/client-actions";
import { DRZAVE } from "@/types/database";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [drzava, setDrzava] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const result = await signUpClient(formData);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    if (result.success) {
      setSuccess(result.success);
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
      {success ? (
        <Alert role="status">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="ime">Ime</Label>
        <Input id="ime" name="ime" type="text" autoComplete="given-name" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prezime">Prezime</Label>
        <Input
          id="prezime"
          name="prezime"
          type="text"
          autoComplete="family-name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="korisnicko_ime">Korisničko ime</Label>
        <Input
          id="korisnicko_ime"
          name="korisnicko_ime"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_.-]+"
          placeholder="npr. marko123"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lozinka">Lozinka</Label>
        <Input
          id="lozinka"
          name="lozinka"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="drzava">Država</Label>
        <input type="hidden" name="drzava" value={drzava} required />
        <Select value={drzava} onValueChange={(value) => setDrzava(value ?? "")}>
          <SelectTrigger id="drzava" className="w-full">
            <SelectValue placeholder="Izaberite državu" />
          </SelectTrigger>
          <SelectContent>
            {DRZAVE.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Registracija..." : "Registruj se"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Već imate nalog?{" "}
        <AppLink href="/prijava" className="text-primary font-semibold hover:underline">
          Prijavite se
        </AppLink>
      </p>
    </form>
  );
}
