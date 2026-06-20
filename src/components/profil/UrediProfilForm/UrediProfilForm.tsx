"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { AppLink } from "@/components/ui/AppLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/providers/AuthProvider";
import { ObrisiNalogSection } from "@/components/profil/ObrisiNalogSection/ObrisiNalogSection";
import { updateProfilClient } from "@/lib/korisnik/update-client";
import { LokacijaPicker } from "@/components/profil/UrediProfilForm/LokacijaPicker";
import {
  buildMapsUrlFromCoords,
  isGoogleMapsUrl,
} from "@/lib/lokacije/maps";
import {
  POZIVNI_BROJEVI,
  razdvojBrojTelefona,
  sastaviBrojTelefona,
} from "@/lib/telefon/pozivni";
import { DRZAVE } from "@/types/database";
import { cn } from "@/lib/utils";

export type UrediProfilInitial = {
  ime: string;
  prezime: string;
  korisnicko_ime: string;
  inf_o_korisniku: string;
  drzava: string;
  broj_telefona: string | null;
  profilna_slika: string | null;
  lokacija: string;
  email: string;
  krediti: number;
};

type UrediProfilFormProps = {
  korisnikId: number;
  userUuid: string;
  initial: UrediProfilInitial;
};

const selectClassName = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30",
);

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

  const [imaRadnju, setImaRadnju] = useState(initial.lokacija.trim() !== "");
  const [lokacija, setLokacija] = useState(initial.lokacija);
  const lokacijaTrimmed = lokacija.trim();
  const lokacijaValidna =
    lokacijaTrimmed === "" || isGoogleMapsUrl(lokacijaTrimmed);

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
      lokacija: String(fd.get("lokacija") ?? ""),
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
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert
          className="border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          role="status"
        >
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label id="avatar-label">Profilna slika</Label>
        <div
          className="flex items-center gap-6"
          role="group"
          aria-labelledby="avatar-label"
        >
          <Avatar className="size-[88px] shrink-0">
            {prikazaniAvatar ? (
              <AvatarImage src={prikazaniAvatar} alt="Profilna slika" />
            ) : null}
            <AvatarFallback className="text-2xl font-bold">
              {getInitials(ime || "?", prezime || "")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              id="avatar"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarChange}
              disabled={pending}
              tabIndex={-1}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
            >
              Promijeni sliku
            </Button>
            {prikazaniAvatar && (
              <Button
                type="button"
                variant="destructive"
                onClick={removeAvatar}
                disabled={pending}
              >
                Ukloni
              </Button>
            )}
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          Sajt automatski smanjuje sliku na najviše 2 MB.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ime">Ime *</Label>
        <Input
          id="ime"
          name="ime"
          type="text"
          autoComplete="given-name"
          required
          value={ime}
          onChange={(e) => setIme(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prezime">Prezime *</Label>
        <Input
          id="prezime"
          name="prezime"
          type="text"
          autoComplete="family-name"
          required
          value={prezime}
          onChange={(e) => setPrezime(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="korisnicko_ime">Korisničko ime *</Label>
        <Input
          id="korisnicko_ime"
          name="korisnicko_ime"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_.-]+"
          defaultValue={initial.korisnicko_ime}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="inf_o_korisniku">O meni</Label>
        <Textarea
          id="inf_o_korisniku"
          name="inf_o_korisniku"
          rows={4}
          defaultValue={initial.inf_o_korisniku}
          placeholder="Nekoliko rečenica o vama i vašem radu..."
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2.5">
          <Checkbox
            checked={imaRadnju}
            onCheckedChange={(checked) => setImaRadnju(checked === true)}
          />
          Imam radnju (prikaži lokaciju na profilu)
        </Label>

        {imaRadnju && (
          <div className="space-y-2 pt-1">
            <p className="text-muted-foreground text-sm">
              Kliknite na mapu da označite lokaciju svoje radnje (možete je
              pomjerati i prevlačiti oznaku). Lokacija će se prikazivati na
              vašem profilu.
            </p>
            <LokacijaPicker
              value={lokacija}
              onPick={({ lat, lng }) =>
                setLokacija(buildMapsUrlFromCoords(lat, lng))
              }
            />
            <Input
              id="lokacija"
              name="lokacija"
              type="url"
              inputMode="url"
              value={lokacija}
              onChange={(e) => setLokacija(e.target.value)}
              placeholder="ili nalijepite Google Maps link (https://maps.google.com/...)"
              aria-invalid={!lokacijaValidna}
            />
            {!lokacijaValidna ? (
              <p className="text-destructive text-sm">
                Unesite ispravan Google Maps link (npr.
                https://maps.app.goo.gl/...).
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Polje za link se popunjava automatski kad označite lokaciju na
                mapi.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="drzava">Država *</Label>
        <select
          id="drzava"
          name="drzava"
          required
          className={selectClassName}
          defaultValue={initial.drzava}
        >
          {DRZAVE.map((drzava) => (
            <option key={drzava} value={drzava}>
              {drzava}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefon">Broj telefona</Label>
        <div className="flex items-center gap-2">
          <select
            id="pozivni"
            name="pozivni"
            className={cn(selectClassName, "w-auto min-w-36 shrink-0")}
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
          <Input
            id="telefon"
            name="telefon"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            className="min-w-0 flex-1"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            placeholder={
              POZIVNI_BROJEVI.find((p) => p.kod === pozivni)?.primjer ??
              "066 123 456"
            }
          />
        </div>
        <p className="text-muted-foreground text-sm">
          Izaberite državu i unesite broj (npr. 066 123 456). Broj verifikujete
          na stranici „Verifikacija”.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Krediti</Label>
        <p className="rounded-lg border border-dashed bg-muted px-4 py-3 text-muted-foreground">
          {initial.krediti} kredita
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={initial.email}
        />
        <p className="text-muted-foreground text-sm">
          Promjenom emaila šaljemo link za potvrdu na novu adresu.
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="nova_lozinka">Nova lozinka</Label>
        <Input
          id="nova_lozinka"
          name="nova_lozinka"
          type="password"
          autoComplete="new-password"
          minLength={6}
          placeholder="Ostavite prazno ako ne mijenjate"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="potvrda_lozinke">Potvrda nove lozinke</Label>
        <Input
          id="potvrda_lozinke"
          name="potvrda_lozinke"
          type="password"
          autoComplete="new-password"
          minLength={6}
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Čuvanje..." : "Sačuvaj izmjene"}
      </Button>

      <ObrisiNalogSection />

      <p className="text-muted-foreground text-center text-sm">
        <AppLink
          href={`/profil/${korisnikId}`}
          className="text-primary font-semibold hover:underline"
        >
          Nazad na profil
        </AppLink>
      </p>
    </form>
  );
}
