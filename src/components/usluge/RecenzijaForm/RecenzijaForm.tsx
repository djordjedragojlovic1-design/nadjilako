"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { StarRatingInput } from "@/components/usluge/StarRating/StarRatingInput";
import {
  createRecenzijaClient,
  KOMENTAR_MAX,
  updateRecenzijaClient,
} from "@/lib/usluge/recenzije-client";
import authStyles from "@/components/auth/auth.module.css";
import styles from "./RecenzijaForm.module.css";

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
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>
        {jeIzmjena ? "Uredite recenziju" : "Ostavite recenziju"}
      </h3>

      {error && (
        <p className={`${authStyles.alert} ${authStyles.alertError}`} role="alert">
          {error}
        </p>
      )}

      <div className={authStyles.field}>
        <span className={authStyles.label}>Ocjena *</span>
        <StarRatingInput value={ocjena} onChange={setOcjena} disabled={pending} />
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="komentar">
          Komentar
        </label>
        <textarea
          id="komentar"
          name="komentar"
          rows={4}
          maxLength={KOMENTAR_MAX}
          className={authStyles.textarea}
          value={komentar}
          onChange={(e) => setKomentar(e.target.value)}
          placeholder="Podijelite svoje iskustvo s ovom uslugom..."
          disabled={pending}
        />
      </div>

      <div className={authStyles.field}>
        <span className={authStyles.label}>Slika (opciono)</span>
        <div className={styles.slikaRow}>
          {prikazanaSlika && (
            <div className={styles.slikaPreview}>
              <Image
                src={prikazanaSlika}
                alt="Pregled slike"
                fill
                sizes="120px"
                className={styles.slikaImg}
                unoptimized
              />
            </div>
          )}
          <div className={styles.slikaActions}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleSlikaChange}
              disabled={pending}
              tabIndex={-1}
            />
            <button
              type="button"
              className={styles.pickBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
            >
              {prikazanaSlika ? "Promijeni sliku" : "Dodaj sliku"}
            </button>
            {prikazanaSlika && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={ukloni}
                disabled={pending}
              >
                Ukloni
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={pending}>
          {pending
            ? "Slanje..."
            : jeIzmjena
              ? "Sačuvaj izmjene"
              : "Objavi recenziju"}
        </button>
        {onCancel && (
          <button
            type="button"
            className={styles.cancel}
            onClick={onCancel}
            disabled={pending}
          >
            Odustani
          </button>
        )}
      </div>
    </form>
  );
}
