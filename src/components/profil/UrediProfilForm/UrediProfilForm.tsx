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
import { AppLink } from "@/components/ui/AppLink";
import { useAuth } from "@/components/providers/AuthProvider";
import { updateProfilClient } from "@/lib/korisnik/update-client";
import {
  POZIVNI_BROJEVI,
  razdvojBrojTelefona,
  sastaviBrojTelefona,
} from "@/lib/telefon/pozivni";
import { DRZAVE } from "@/types/database";
import authStyles from "@/components/auth/auth.module.css";
import styles from "./UrediProfilForm.module.css";

export type UrediProfilInitial = {
  ime: string;
  prezime: string;
  korisnicko_ime: string;
  inf_o_korisniku: string;
  drzava: string;
  broj_telefona: string | null;
  profilna_slika: string | null;
  email: string;
  krediti: number;
};

type UrediProfilFormProps = {
  korisnikId: number;
  userUuid: string;
  initial: UrediProfilInitial;
};

function getInitials(ime: string, prezime: string) {
  return `${ime.charAt(0)}${prezime.charAt(0)}`.toUpperCase();
}

export function UrediProfilForm({
  korisnikId,
  userUuid,
  initial,
}: UrediProfilFormProps) {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [ime, setIme] = useState(initial.ime);
  const [prezime, setPrezime] = useState(initial.prezime);

  const pocetniTelefon = razdvojBrojTelefona(initial.broj_telefona);
  const [pozivni, setPozivni] = useState(pocetniTelefon.kod);
  const [telefon, setTelefon] = useState(pocetniTelefon.lokalni);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initial.profilna_slika,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [ukloniAvatar, setUkloniAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const trenutniAvatar = ukloniAvatar ? null : avatarUrl;
  const prikazaniAvatar = avatarPreview ?? trenutniAvatar;

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Dozvoljeni su samo fajlovi slika.");
      return;
    }
    setError(null);
    setAvatarFile(file);
    setUkloniAvatar(false);
  }

  function removeAvatar() {
    setAvatarFile(null);
    setUkloniAvatar(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);

    const fd = new FormData(e.currentTarget);

    const result = await updateProfilClient(korisnikId, userUuid, {
      ime: String(fd.get("ime") ?? ""),
      prezime: String(fd.get("prezime") ?? ""),
      korisnicko_ime: String(fd.get("korisnicko_ime") ?? "").trim(),
      inf_o_korisniku: String(fd.get("inf_o_korisniku") ?? ""),
      drzava: String(fd.get("drzava") ?? ""),
      brojTelefona: sastaviBrojTelefona(
        String(fd.get("pozivni") ?? ""),
        String(fd.get("telefon") ?? ""),
      ),
      trenutniBrojTelefona: initial.broj_telefona,
      avatarFile,
      ukloniAvatar,
      trenutniEmail: initial.email,
      email: String(fd.get("email") ?? ""),
      novaLozinka: String(fd.get("nova_lozinka") ?? ""),
      potvrdaLozinke: String(fd.get("potvrda_lozinke") ?? ""),
    });

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    if (result.profilna_slika !== undefined) {
      setAvatarUrl(result.profilna_slika);
    }
    setSuccess(result.success ?? "Profil je sačuvan.");
    setAvatarFile(null);
    setUkloniAvatar(false);
    setPending(false);
    await refreshProfile();
    router.refresh();
  }

  return (
    <form className={authStyles.form} onSubmit={handleSubmit}>
      {error && (
        <p className={`${authStyles.alert} ${authStyles.alertError}`} role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className={`${authStyles.alert} ${authStyles.alertSuccess}`} role="status">
          {success}
        </p>
      )}

      <div className={authStyles.field}>
        <span className={authStyles.label} id="avatar-label">
          Profilna slika
        </span>
        <div className={styles.avatarRow} role="group" aria-labelledby="avatar-label">
          <div className={styles.avatar}>
            {prikazaniAvatar ? (
              <Image
                src={prikazaniAvatar}
                alt="Profilna slika"
                width={88}
                height={88}
                unoptimized
                className={styles.avatarImg}
              />
            ) : (
              <span className={styles.avatarInitials}>
                {getInitials(ime || "?", prezime || "")}
              </span>
            )}
          </div>
          <div className={styles.avatarActions}>
            <input
              ref={fileInputRef}
              id="avatar"
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleAvatarChange}
              disabled={pending}
              tabIndex={-1}
            />
            <button
              type="button"
              className={styles.pickBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
            >
              Promijeni sliku
            </button>
            {prikazaniAvatar && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={removeAvatar}
                disabled={pending}
              >
                Ukloni
              </button>
            )}
          </div>
        </div>
        <p className={styles.hint}>Sajt automatski smanjuje sliku na najviše 2 MB.</p>
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="ime">
          Ime *
        </label>
        <input
          id="ime"
          name="ime"
          type="text"
          autoComplete="given-name"
          required
          className={authStyles.input}
          value={ime}
          onChange={(e) => setIme(e.target.value)}
        />
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="prezime">
          Prezime *
        </label>
        <input
          id="prezime"
          name="prezime"
          type="text"
          autoComplete="family-name"
          required
          className={authStyles.input}
          value={prezime}
          onChange={(e) => setPrezime(e.target.value)}
        />
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="korisnicko_ime">
          Korisničko ime *
        </label>
        <input
          id="korisnicko_ime"
          name="korisnicko_ime"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_.-]+"
          className={authStyles.input}
          defaultValue={initial.korisnicko_ime}
        />
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="inf_o_korisniku">
          O meni
        </label>
        <textarea
          id="inf_o_korisniku"
          name="inf_o_korisniku"
          rows={4}
          className={authStyles.textarea}
          defaultValue={initial.inf_o_korisniku}
          placeholder="Nekoliko rečenica o vama i vašem radu..."
        />
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="drzava">
          Država *
        </label>
        <select
          id="drzava"
          name="drzava"
          required
          className={authStyles.select}
          defaultValue={initial.drzava}
        >
          {DRZAVE.map((drzava) => (
            <option key={drzava} value={drzava}>
              {drzava}
            </option>
          ))}
        </select>
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="telefon">
          Broj telefona
        </label>
        <div className={styles.telefonRow}>
          <select
            id="pozivni"
            name="pozivni"
            className={`${authStyles.select} ${styles.pozivniSelect}`}
            value={pozivni}
            onChange={(e) => setPozivni(e.target.value)}
            aria-label="Pozivni broj države"
          >
            {POZIVNI_BROJEVI.map(({ kod, drzava }) => (
              <option key={kod} value={kod}>
                {kod} ({drzava})
              </option>
            ))}
          </select>
          <input
            id="telefon"
            name="telefon"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            className={authStyles.input}
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            placeholder={
              POZIVNI_BROJEVI.find((p) => p.kod === pozivni)?.primjer ??
              "066 123 456"
            }
          />
        </div>
        <p className={styles.hint}>
          Izaberite državu i unesite broj (npr. 066 123 456). Broj verifikujete
          na stranici „Verifikacija”.
        </p>
      </div>

      <div className={authStyles.field}>
        <span className={authStyles.label}>Krediti</span>
        <p className={styles.readonly}>{initial.krediti} kredita</p>
      </div>

      <hr className={styles.divider} />

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="email">
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={authStyles.input}
          defaultValue={initial.email}
        />
        <p className={styles.hint}>
          Promjenom emaila šaljemo link za potvrdu na novu adresu.
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="nova_lozinka">
          Nova lozinka
        </label>
        <input
          id="nova_lozinka"
          name="nova_lozinka"
          type="password"
          autoComplete="new-password"
          minLength={6}
          className={authStyles.input}
          placeholder="Ostavite prazno ako ne mijenjate"
        />
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="potvrda_lozinke">
          Potvrda nove lozinke
        </label>
        <input
          id="potvrda_lozinke"
          name="potvrda_lozinke"
          type="password"
          autoComplete="new-password"
          minLength={6}
          className={authStyles.input}
        />
      </div>

      <button type="submit" className={authStyles.submit} disabled={pending}>
        {pending ? "Čuvanje..." : "Sačuvaj izmjene"}
      </button>

      <p className={authStyles.footer}>
        <AppLink href={`/profil/${korisnikId}`}>Nazad na profil</AppLink>
      </p>
    </form>
  );
}
