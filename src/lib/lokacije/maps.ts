const COORD_PATTERNS = [
  /@(-?\d+\.\d+),(-?\d+\.\d+)/,
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
  /[?&](?:q|query|ll|center|destination|daddr)=(-?\d+\.\d+),(-?\d+\.\d+)/,
];

export function isGoogleMapsUrl(value: string): boolean {
  let u: URL;
  try {
    u = new URL(value.trim());
  } catch {
    return false;
  }

  if (u.protocol !== "https:" && u.protocol !== "http:") return false;

  const host = u.hostname.toLowerCase();
  if (host === "maps.app.goo.gl" || host === "goo.gl") return true;
  if (host === "maps.google.com") return true;

  const isGoogleHost = /(^|\.)google\.[a-z.]+$/.test(host);
  if (isGoogleHost && u.pathname.toLowerCase().includes("/maps")) return true;

  return false;
}

export function extractMapsCoords(
  value: string,
): { lat: number; lng: number } | null {
  for (const pattern of COORD_PATTERNS) {
    const match = value.match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
      ) {
        return { lat, lng };
      }
    }
  }
  return null;
}

export function buildMapsEmbedUrl(value: string): string | null {
  const coords = extractMapsCoords(value);
  if (!coords) return null;
  return `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&hl=sr&output=embed`;
}

export function buildMapsUrlFromCoords(lat: number, lng: number): string {
  const roundedLat = Number(lat.toFixed(6));
  const roundedLng = Number(lng.toFixed(6));
  return `https://www.google.com/maps?q=${roundedLat},${roundedLng}`;
}
