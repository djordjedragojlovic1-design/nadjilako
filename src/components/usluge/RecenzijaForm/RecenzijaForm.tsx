"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRatingInput } from "@/components/usluge/StarRating/StarRatingInput";
import {
  createRecenzijaClient,
  KOMENTAR_MAX,
  updateRecenzijaClient,
} from "@/lib/usluge/recenzije-client";

export type RecenzijaInitial = {
  id: number;
  ocjena: number;
  komentar: string | null;
  slika: string | null;
};

type RecenzijaFormProps = {
  uslugaId: number;
  ocjenjivacId: number;
  ocjenjenId: number;
  userUuid: string;
  initial?: RecenzijaInitial;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function RecenzijaForm({
  uslugaId,
  ocjenjivacId,
  ocjenjenId,
  userUuid,
  initial,
  onSuccess,
  onCancel,
}: RecenzijaFormProps) {
  const jeIzmjena = initial != null;

  const [ocjena, setOcjena] = useState(initial?.ocjena ?? 0);
  const [komentar, setKomentar] = useState(initial?.komentar ?? "");
  const [slikaFile, setSlikaFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [postojecaSlika, setPostojecaSlika] = useState<string | null>(
    initial?.slika ?? null,
  );
  const [ukloniSliku, setUkloniSliku] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slikaFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(slikaFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [slikaFile]);

  const prikazanaSlika = preview ?? (ukloniSliku ? null : postojecaSlika);

  function handleSlikaChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Dozvoljeni su samo fajlovi slika.");
      return;
    }
    setError(null);
    setSlikaFile(file);
    setUkloniSliku(false);
  }

  function ukloni() {
    setSlikaFile(null);
    setUkloniSliku(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result =
      jeIzmjena && initial
        ? await updateRecenzijaClient({
            recenzijaId: initial.id,
            userUuid,
            ocjena,
            komentar,
            slikaFile,
            postojecaSlika,
            ukloniSliku,
          })
        : await createRecenzijaClient({
            uslugaId,
            ocjenjivacId,
            ocjenjenId,
            userUuid,
            ocjena,
            komentar,
            slikaFile,
          });

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setPending(false);
    if (!jeIzmjena) {
      setOcjena(0);
      setKomentar("");
      setSlikaFile(null);
      setPostojecaSlika(null);
      setUkloniSliku(false);
    }
    onSuccess();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{jeIzmjena ? "Uredite recenziju" : "Ostavite recenziju"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Ocjena *</Label>
            <StarRatingInput value={ocjena} onChange={setOcjena} disabled={pending} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="komentar">Komentar</Label>
            <Textarea
              id="komentar"
              name="komentar"
              rows={4}
              maxLength={KOMENTAR_MAX}
              value={komentar}
              onChange={(e) => setKomentar(e.target.value)}
              placeholder="Podijelite svoje iskustvo s ovom uslugom..."
              disabled={pending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Slika (opciono)</Label>
            <div className="flex items-center gap-4">
              {prikazanaSlika && (
                <div className="relative h-20 w-[7.5rem] shrink-0 overflow-hidden rounded-lg border">
                  <Image
                    src={prikazanaSlika}
                    alt="Pregled slike"
                    fill
                    sizes="120px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleSlikaChange}
                  disabled={pending}
                  tabIndex={-1}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={pending}
                >
                  {prikazanaSlika ? "Promijeni sliku" : "Dodaj sliku"}
                </Button>
                {prikazanaSlika && (
                  <Button
                    type="button"
                    variant="outline"
                    className="hover:border-destructive hover:text-destructive"
                    onClick={ukloni}
                    disabled={pending}
                  >
                    Ukloni
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending
                ? "Slanje..."
                : jeIzmjena
                  ? "Sačuvaj izmjene"
                  : "Objavi recenziju"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
                Odustani
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
