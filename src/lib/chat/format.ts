export function getInitials(ime: string, prezime: string): string {
  return `${ime.charAt(0)}${prezime.charAt(0)}`.toUpperCase();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatKratkoVrijeme(iso: string): string {
  const d = new Date(iso);
  const sada = new Date();
  if (isSameDay(d, sada)) {
    return d.toLocaleTimeString("sr", { hour: "2-digit", minute: "2-digit" });
  }
  const juce = new Date(sada);
  juce.setDate(sada.getDate() - 1);
  if (isSameDay(d, juce)) return "juče";

  return d.toLocaleDateString("sr", { day: "2-digit", month: "2-digit" });
}

export function formatVrijemePoruke(iso: string): string {
  return new Date(iso).toLocaleTimeString("sr", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDanGrupa(iso: string): string {
  const d = new Date(iso);
  const sada = new Date();
  if (isSameDay(d, sada)) return "Danas";

  const juce = new Date(sada);
  juce.setDate(sada.getDate() - 1);
  if (isSameDay(d, juce)) return "Juče";

  return d.toLocaleDateString("sr", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function danKljuc(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
