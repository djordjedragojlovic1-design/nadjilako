"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { useAuth } from "@/components/providers/AuthProvider";
import { StarRating } from "@/components/usluge/StarRating/StarRating";
import { RecenzijaForm } from "@/components/usluge/RecenzijaForm/RecenzijaForm";
import {
  createOdgovorClient,
  deleteOdgovorClient,
  deleteRecenzijaClient,
  KOMENTAR_MAX,
} from "@/lib/usluge/recenzije-client";
import type { OdgovorItem, RecenzijaItem } from "@/lib/usluge/types";
import { formatDatum } from "@/lib/usluge/utils";
import styles from "./RecenzijeSekcija.module.css";

type RecenzijeSekcijaProps = {
  uslugaId: number;
  ocjenjenId: number;
  recenzije: RecenzijaItem[];
};

function getInitials(ime: string, prezime: string): string {
  return `${ime.charAt(0)}${prezime.charAt(0)}`.toUpperCase();
}

function Avatar({
  slika,
  ime,
  prezime,
  velicina = 40,
}: {
  slika: string | null;
  ime: string;
  prezime: string;
  velicina?: number;
}) {
  return (
    <div className={styles.avatar} style={{ width: velicina, height: velicina }}>
      {slika ? (
        <Image
          src={slika}
          alt=""
          width={velicina}
          height={velicina}
          className={styles.avatarImg}
          unoptimized
        />
      ) : (
        getInitials(ime, prezime)
      )}
    </div>
  );
}

function OdgovorForm({
  uslugaId,
  parentId,
  ocjenjenId,
  ocjenjivacId,
  onSuccess,
  onCancel,
}: {
  uslugaId: number;
  parentId: number;
  ocjenjenId: number;
  ocjenjivacId: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [tekst, setTekst] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await createOdgovorClient({
      parentId,
      uslugaId,
      ocjenjivacId,
      ocjenjenId,
      komentar: tekst,
    });

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setPending(false);
    setTekst("");
    onSuccess();
  }

  return (
    <form className={styles.odgovorForm} onSubmit={handleSubmit}>
      {error && <p className={styles.error}>{error}</p>}
      <textarea
        className={styles.odgovorInput}
        rows={2}
        maxLength={KOMENTAR_MAX}
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        placeholder="Napišite odgovor..."
        disabled={pending}
      />
      <div className={styles.odgovorActions}>
        <button type="submit" className={styles.smallPrimary} disabled={pending}>
          {pending ? "Slanje..." : "Pošalji"}
        </button>
        <button
          type="button"
          className={styles.smallGhost}
          onClick={onCancel}
          disabled={pending}
        >
          Odustani
        </button>
      </div>
    </form>
  );
}

function Odgovor({
  odgovor,
  mojeId,
  onDelete,
}: {
  odgovor: OdgovorItem;
  mojeId: number | null;
  onDelete: (id: number) => void;
}) {
  return (
    <li className={styles.odgovor}>
      <Avatar
        slika={odgovor.ocjenjivac.profilna_slika}
        ime={odgovor.ocjenjivac.ime}
        prezime={odgovor.ocjenjivac.prezime}
        velicina={32}
      />
      <div className={styles.odgovorBody}>
        <div className={styles.odgovorMeta}>
          <span className={styles.odgovorAutor}>
            {odgovor.ocjenjivac.ime} {odgovor.ocjenjivac.prezime}
          </span>
          <span className={styles.datum}>{formatDatum(odgovor.created_at)}</span>
          {mojeId === odgovor.ocjenjivac.id && (
            <button
              type="button"
              className={styles.linkDanger}
              onClick={() => onDelete(odgovor.id)}
            >
              Obriši
            </button>
          )}
        </div>
        <p className={styles.odgovorTekst}>{odgovor.komentar}</p>
      </div>
    </li>
  );
}

export function RecenzijeSekcija({
  uslugaId,
  ocjenjenId,
  recenzije,
}: RecenzijeSekcijaProps) {
  const router = useRouter();
  const { korisnik, loading } = useAuth();
  const mojeId = korisnik?.id ?? null;
  const jeVlasnik = mojeId != null && mojeId === ocjenjenId;
  const mojaRecenzija = recenzije.find((r) => r.ocjenjivac.id === mojeId);

  const [editujem, setEditujem] = useState(false);
  const [odgovorOtvoren, setOdgovorOtvoren] = useState<number | null>(null);

  function osvjezi() {
    setEditujem(false);
    setOdgovorOtvoren(null);
    router.refresh();
  }

  async function obrisiRecenziju(id: number) {
    if (!window.confirm("Obrisati vašu recenziju?")) return;
    const result = await deleteRecenzijaClient(id);
    if (result.error) {
      window.alert(result.error);
      return;
    }
    router.refresh();
  }

  async function obrisiOdgovor(id: number) {
    if (!window.confirm("Obrisati odgovor?")) return;
    const result = await deleteOdgovorClient(id);
    if (result.error) {
      window.alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className={styles.wrap}>
      {!loading && (
        <div className={styles.formArea}>
          {!korisnik ? (
            <p className={styles.prompt}>
              <AppLink href="/prijava">Prijavite se</AppLink> da biste ostavili
              recenziju.
            </p>
          ) : jeVlasnik ? (
            <p className={styles.prompt}>
              Ovo je vaša usluga — ne možete je ocijeniti, ali možete odgovoriti
              na recenzije.
            </p>
          ) : !mojaRecenzija ? (
            <RecenzijaForm
              uslugaId={uslugaId}
              ocjenjivacId={korisnik.id}
              ocjenjenId={ocjenjenId}
              userUuid={korisnik.user_uuid}
              onSuccess={osvjezi}
            />
          ) : null}
        </div>
      )}

      {recenzije.length === 0 ? (
        <p className={styles.empty}>Još nema recenzija za ovu uslugu.</p>
      ) : (
        <ul className={styles.lista}>
          {recenzije.map((r) =>
            mojaRecenzija &&
            r.id === mojaRecenzija.id &&
            editujem &&
            korisnik ? (
              <li key={r.id}>
                <RecenzijaForm
                  uslugaId={uslugaId}
                  ocjenjivacId={korisnik.id}
                  ocjenjenId={ocjenjenId}
                  userUuid={korisnik.user_uuid}
                  initial={{
                    id: r.id,
                    ocjena: r.ocjena,
                    komentar: r.komentar,
                    slika: r.slika,
                  }}
                  onSuccess={osvjezi}
                  onCancel={() => setEditujem(false)}
                />
              </li>
            ) : (
              <li key={r.id} className={styles.recenzija}>
                <div className={styles.recenzijaHeader}>
                  <Avatar
                    slika={r.ocjenjivac.profilna_slika}
                    ime={r.ocjenjivac.ime}
                    prezime={r.ocjenjivac.prezime}
                  />
                  <div className={styles.recenzijaMeta}>
                    <p className={styles.autor}>
                      {r.ocjenjivac.ime} {r.ocjenjivac.prezime}
                    </p>
                    <p className={styles.datum}>{formatDatum(r.created_at)}</p>
                  </div>
                  <StarRating rating={r.ocjena} showCount={false} />
                </div>

                {r.komentar && <p className={styles.komentar}>{r.komentar}</p>}
                {r.slika && (
                  <div className={styles.slika}>
                    <Image
                      src={r.slika}
                      alt=""
                      fill
                      sizes="320px"
                      className={styles.slikaImg}
                      unoptimized
                    />
                  </div>
                )}

                <div className={styles.recenzijaActions}>
                  {korisnik && (
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() =>
                        setOdgovorOtvoren((prev) =>
                          prev === r.id ? null : r.id,
                        )
                      }
                    >
                      Odgovori
                    </button>
                  )}
                  {mojeId === r.ocjenjivac.id && (
                    <>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => setEditujem(true)}
                      >
                        Uredi
                      </button>
                      <button
                        type="button"
                        className={styles.linkDanger}
                        onClick={() => obrisiRecenziju(r.id)}
                      >
                        Obriši
                      </button>
                    </>
                  )}
                </div>

                {(r.odgovori.length > 0 || odgovorOtvoren === r.id) && (
                  <ul className={styles.odgovoriLista}>
                    {r.odgovori.map((o) => (
                      <Odgovor
                        key={o.id}
                        odgovor={o}
                        mojeId={mojeId}
                        onDelete={obrisiOdgovor}
                      />
                    ))}
                  </ul>
                )}

                {odgovorOtvoren === r.id && korisnik && (
                  <OdgovorForm
                    uslugaId={uslugaId}
                    parentId={r.id}
                    ocjenjenId={ocjenjenId}
                    ocjenjivacId={korisnik.id}
                    onSuccess={osvjezi}
                    onCancel={() => setOdgovorOtvoren(null)}
                  />
                )}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
