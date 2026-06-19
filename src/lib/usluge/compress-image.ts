import { SLIKA_TARGET_MAX_BYTES } from "./constants";

const MAX_DIMENSION = 1600;
const MIN_DIMENSION = 600;
const MIN_QUALITY = 0.5;

function scaledDimensions(
  width: number,
  height: number,
  maxSide: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Kompresija slike nije uspjela."));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

async function renderToCanvas(
  file: File,
  maxSide: number,
): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = scaledDimensions(
    bitmap.width,
    bitmap.height,
    maxSide,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Preglednik ne podržava obradu slika.");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas;
}

async function compressAtSize(
  file: File,
  maxSide: number,
): Promise<Blob | null> {
  const canvas = await renderToCanvas(file, maxSide);
  let quality = 0.92;

  while (quality >= MIN_QUALITY) {
    const blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (blob.size <= SLIKA_TARGET_MAX_BYTES) {
      return blob;
    }
    quality -= 0.08;
  }

  return null;
}

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Izabrani fajl nije slika.");
  }

  if (file.size <= SLIKA_TARGET_MAX_BYTES && file.type === "image/jpeg") {
    return file;
  }

  let maxSide = MAX_DIMENSION;
  let blob: Blob | null = null;

  while (maxSide >= MIN_DIMENSION) {
    blob = await compressAtSize(file, maxSide);
    if (blob) break;
    maxSide = Math.round(maxSide * 0.85);
  }

  if (!blob) {
    blob = await compressAtSize(file, MIN_DIMENSION);
  }

  if (!blob) {
    const limitKB = Math.round(SLIKA_TARGET_MAX_BYTES / 1024);
    throw new Error(`Slika se ne može smanjiti ispod ${limitKB} KB.`);
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "slika";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export async function compressImageFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map((file) => compressImageFile(file)));
}
