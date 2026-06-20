export function mapAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Pogrešan email ili lozinka.";
  }
  if (lower.includes("email not confirmed")) {
    return "Potvrdite email adresu pre prijave.";
  }
  if (lower.includes("user already registered")) {
    return "Nalog sa ovim emailom već postoji.";
  }
  if (lower.includes("password")) {
    return "Lozinka mora imati najmanje 6 karaktera.";
  }
  if (lower.includes("duplicate") || lower.includes("unique")) {
    return "Korisničko ime je već zauzeto.";
  }
  if (lower.includes("signup is disabled")) {
    return "Registracija trenutno nije omogućena.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Previše pokušaja. Sačekajte nekoliko minuta i pokušajte ponovo.";
  }
  if (lower.includes("invalid otp") || lower.includes("token has expired")) {
    return "Link je istekao ili je već iskorišten. Zatražite novi.";
  }

  return message;
}
