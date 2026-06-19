"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { MjestaRadaPicker } from "@/components/lokacije/MjestaRadaPicker/MjestaRadaPicker";
import { AppLink } from "@/components/ui/AppLink";
import { useAuth } from "@/components/providers/AuthProvider";
import { promovisiUsluguClient } from "@/lib/krediti/client";
import {
  PROMO_CIJENE,
  PROMO_LABELS,
  PROMO_TIPOVI,
  type PromoTip,
} from "@/lib/krediti/constants";
import { compressImageFiles } from "@/lib/usluge/compress-image";
import {
  SLIKE_MAX_COUNT,
  STATUS_OPTIONS,
  TIP_CIJENE_LABELS,
  TIP_CIJENE_OPTIONS,
  VALUTA_LABELS,
  VALUTA_OPTIONS,
} from "@/lib/usluge/constants";
import { createUslugaClient } from "@/lib/usluge/create-client";
import { updateUslugaClient } from "@/lib/usluge/update-client";
import type { UslugaSlika } from "@/lib/usluge/types";
import { validateUslugaSlike } from "@/lib/usluge/upload-slike";
import type { Drzava } from "@/types/database";
import authStyles from "@/components/auth/auth.module.css";
import { KategorijaIdSelect } from "./KategorijaIdSelect";
import styles from "./ObjaviUsluguForm.module.css";

type Kategorija = { id: number; naziv: string; parentNaziv?: string | null };

export type UslugaFormInitial = {
  naziv: string;
  informacije: string;
  status: string;
  cijena: number;
  tip_cijene: string;
  valuta: string;
  kategorija_id: number | null;
  drzave: Drzava[];
  gradovi: string[];
  postojeceSlike: UslugaSlika[];
};

type UslugaFormProps = {
  mode: "create" | "edit";
  korisnikId: number;
  userUuid: string;
  kategorije: Kategorija[];
  uslugaId?: number;
  initial?: UslugaFormInitial;
};

function slikeStatusText(count: number): string {
  if (count === 0) return "Nijedna slika nije izabrana";
  if (count === 1) return "Izabrana je 1 slika";
  if (count >= 2 && count <= 4) return `Izabrane su ${count} slike`;
  return `Izabrano je ${count} slika`;
}

export function UslugaForm({
  mode,
  korisnikId,
  userUuid,
  kategorije,
  uslugaId,
  initial,
}: UslugaFormProps) {
  const router = useRouter();
  const { korisnik, refreshProfile } = useAuth();
  const krediti = korisnik?.krediti ?? 0;
  const [error, setError] = useState<string | null>(null);
  const [promoTip, setPromoTip] = useState<PromoTip | "">("");
  const [pending, setPending] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [drzave, setDrzave] = useState<Drzava[]>(initial?.drzave ?? []);
  const [gradovi, setGradovi] = useState<string[]>(initial?.gradovi ?? []);
  const [kategorijaId, setKategorijaId] = useState<number | null>(
    initial?.kategorija_id ?? null,
  );
  const [tipCijene, setTipCijene] = useState<string>(initial?.tip_cijene ?? "");
  const jeDogovor = tipCijene === "dogovor";
  const [noveSlike, setNoveSlike] = useState<File[]>([]);
  const [novePreview, setNovePreview] = useState<string[]>([]);
  const [postojeceSlike, setPostojeceSlike] = useState<UslugaSlika[]>(
    initial?.postojeceSlike ?? [],
  );
  const [uklonjeneSlikaIds, setUklonjeneSlikaIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ukupnoSlike = postojeceSlike.length + noveSlike.length;
  const canAddSlike = !pending && !compressing && ukupnoSlike < SLIKE_MAX_COUNT;

  useEffect(() => {
    const urls = noveSlike.map((file) => URL.createObjectURL(file));
    setNovePreview(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [noveSlike]);

  async function handleSlikeChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";

    if (selected.length === 0) return;

    const validationError = validateUslugaSlike(selected, postojeceSlike.length + noveSlike.length);
    if (validationError) {
      setError(validationError);
      return;
    }

    setCompressing(true);
    setError(null);

    try {
      const compressed = await compressImageFiles(selected);
      const nextValidation = validateUslugaSlike(compressed, postojeceSlike.length + noveSlike.length);
      if (nextValidation) {
        setError(nextValidation);
        return;
      }
      setNoveSlike((prev) => [...prev, ...compressed]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kompresija slike nije uspjela.");
    } finally {
      setCompressing(false);
    }
  }

  function removeNovaSlika(index: number) {
    setNoveSlike((prev) => prev.filter((_, i) => i !== index));
  }

  function removePostojecaSlika(slika: UslugaSlika) {
    setPostojeceSlike((prev) => prev.filter((s) => s.id !== slika.id));
    setUklonjeneSlikaIds((prev) => [...prev, slika.id]);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const fd = new FormData(e.currentTarget);

    const cijenaRaw = String(fd.get("cijena") ?? "").trim();
    const cijena = jeDogovor
      ? null
      : cijenaRaw === ""
        ? null
        : Number(cijenaRaw);
    const valuta = jeDogovor ? null : String(fd.get("valuta") ?? "BAM");

    const common = {
      naziv: String(fd.get("naziv") ?? ""),
      informacije: String(fd.get("informacije") ?? ""),
      status: String(fd.get("status") ?? "aktivno"),
      cijena,
      tip_cijene: tipCijene,
      valuta,
      kategorija_id: kategorijaId,
      drzave,
      gradovi,
      userUuid,
    };

    const result =
      mode === "create"
        ? await createUslugaClient(korisnikId, { ...common, slike: noveSlike })
        : await updateUslugaClient(korisnikId, uslugaId!, {
            ...common,
            noveSlike,
            zadrzaneSlikaIds: postojeceSlike.map((s) => s.id),
            uklonjeneSlikaIds,
          });

    if (result.error && !result.uslugaId) {
      setError(result.error);
      setPending(false);
      return;
    }

    if (result.uslugaId) {
      // Promocija se aktivira samo pri kreiranju i tek nakon što usluga postoji.
      // Eventualnu grešku (npr. nedovoljno kredita) ne tretiramo kao fatalnu —
      // korisnik može promovisati kasnije sa stranice usluge.
      if (mode === "create" && promoTip) {
        await promovisiUsluguClient(result.uslugaId, promoTip);
        await refreshProfile();
      }

      if (result.error) {
        setError(result.error);
        setPending(false);
        router.push(`/usluga/${result.uslugaId}`);
        return;
      }

      router.refresh();
      router.push(`/usluga/${result.uslugaId}`);
      return;
    }

    setError(mode === "create" ? "Objava nije uspjela." : "Ažuriranje nije uspjelo.");
    setPending(false);
  }

  const isBusy = pending || compressing;

  return (
    <form className={authStyles.form} onSubmit={handleSubmit}>
      {error && (
        <p className={`${authStyles.alert} ${authStyles.alertError}`} role="alert">
          {error}
        </p>
      )}

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="naziv">
          Naziv usluge *
        </label>
        <input
          id="naziv"
          name="naziv"
          required
          className={authStyles.input}
          defaultValue={initial?.naziv}
        />
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="informacije">
          Informacije *
        </label>
        <textarea
          id="informacije"
          name="informacije"
          required
          rows={5}
          className={authStyles.input}
          defaultValue={initial?.informacije}
        />
      </div>

      {kategorije.length > 0 && (
        <div className={authStyles.field}>
          <span className={authStyles.label}>Kategorija</span>
          <KategorijaIdSelect
            kategorije={kategorije}
            value={kategorijaId}
            onChange={setKategorijaId}
          />
        </div>
      )}

      <div className={authStyles.field}>
        <label className={authStyles.label}>Mjesta rada *</label>
        <MjestaRadaPicker
          drzave={drzave}
          gradovi={gradovi}
          onDrzaveChange={setDrzave}
          onGradoviChange={setGradovi}
        />
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          className={authStyles.select}
          defaultValue={initial?.status ?? "aktivno"}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="tip_cijene">
          Tip cijene *
        </label>
        <select
          id="tip_cijene"
          name="tip_cijene"
          required
          className={authStyles.select}
          value={tipCijene}
          onChange={(e) => setTipCijene(e.target.value)}
        >
          <option value="" disabled>
            Izaberite tip
          </option>
          {TIP_CIJENE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {TIP_CIJENE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {!jeDogovor && (
        <>
          <div className={authStyles.field}>
            <label className={authStyles.label} htmlFor="cijena">
              Cijena *
            </label>
            <input
              id="cijena"
              name="cijena"
              type="number"
              min={0}
              step="0.01"
              required
              className={authStyles.input}
              defaultValue={initial?.cijena}
            />
          </div>

          <div className={authStyles.field}>
            <label className={authStyles.label} htmlFor="valuta">
              Valuta *
            </label>
            <select
              id="valuta"
              name="valuta"
              required
              className={authStyles.select}
              defaultValue={initial?.valuta ?? "BAM"}
            >
              {VALUTA_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {VALUTA_LABELS[v]}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {jeDogovor && (
        <p className={styles.hint}>
          Cijena se dogovara — polja za cijenu i valutu nisu obavezna.
        </p>
      )}

      {mode === "create" && (
        <div className={authStyles.field}>
          <label className={authStyles.label} htmlFor="promocija">
            Promocija (opcionalno)
          </label>
          <select
            id="promocija"
            name="promocija"
            className={authStyles.select}
            value={promoTip}
            onChange={(e) => setPromoTip(e.target.value as PromoTip | "")}
          >
            <option value="">Bez promocije</option>
            {PROMO_TIPOVI.map((tip) => (
              <option key={tip} value={tip}>
                {PROMO_LABELS[tip]} — {PROMO_CIJENE[tip]} kredita / 30 dana
              </option>
            ))}
          </select>
          <p className={styles.hint}>
            Imate {krediti} kredita.{" "}
            {promoTip && krediti < PROMO_CIJENE[promoTip] ? (
              <>
                Nedovoljno za izabranu promociju — biće preskočena. Možete je
                aktivirati kasnije sa stranice usluge ili{" "}
                <AppLink href="/krediti">dopuniti kredite</AppLink>.
              </>
            ) : (
              <>Promociju možete kasnije promijeniti na stranici usluge.</>
            )}
          </p>
        </div>
      )}

      <div className={authStyles.field}>
        <span className={authStyles.label} id="slike-label">
          Slike usluge
        </span>
        <div className={styles.filePicker} role="group" aria-labelledby="slike-label">
          <input
            ref={fileInputRef}
            id="slike"
            name="slike"
            type="file"
            accept="image/*"
            multiple
            className={styles.hiddenInput}
            onChange={handleSlikeChange}
            disabled={!canAddSlike}
            tabIndex={-1}
          />
          <button
            type="button"
            className={styles.pickBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={!canAddSlike}
          >
            {compressing ? "Obrada slika..." : "Izaberi slike"}
          </button>
          <span className={styles.fileStatus}>{slikeStatusText(ukupnoSlike)}</span>
        </div>
        <p className={styles.hint}>
          Do {SLIKE_MAX_COUNT} slika. Sajt automatski smanjuje slike na najviše 2 MB.
        </p>
        {(postojeceSlike.length > 0 || novePreview.length > 0) && (
          <div className={styles.previewGrid}>
            {postojeceSlike.map((slika) => (
              <div key={`existing-${slika.id}`} className={styles.previewItem}>
                <Image
                  src={slika.url}
                  alt="Postojeća slika"
                  width={88}
                  height={88}
                  unoptimized
                  className={styles.previewImg}
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removePostojecaSlika(slika)}
                  disabled={isBusy}
                  aria-label="Ukloni postojeću sliku"
                >
                  ×
                </button>
              </div>
            ))}
            {novePreview.map((url, index) => (
              <div key={url} className={styles.previewItem}>
                <Image
                  src={url}
                  alt={`Pregled nove slike ${index + 1}`}
                  width={88}
                  height={88}
                  unoptimized
                  className={styles.previewImg}
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeNovaSlika(index)}
                  disabled={isBusy}
                  aria-label={`Ukloni novu sliku ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="submit" className={authStyles.submit} disabled={isBusy}>
        {pending
          ? mode === "create"
            ? "Objavljivanje..."
            : "Čuvanje..."
          : mode === "create"
            ? "Objavi uslugu"
            : "Sačuvaj izmjene"}
      </button>

      <p className={authStyles.footer}>
        {mode === "edit" && uslugaId ? (
          <>
            <AppLink href={`/usluga/${uslugaId}`}>Nazad na uslugu</AppLink>
            {" · "}
          </>
        ) : null}
        <AppLink href={`/profil/${korisnikId}`}>Nazad na profil</AppLink>
      </p>
    </form>
  );
}

export function ObjaviUsluguForm(
  props: Omit<UslugaFormProps, "mode" | "uslugaId" | "initial">,
) {
  return <UslugaForm mode="create" {...props} />;
}
