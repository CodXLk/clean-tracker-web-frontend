/** Per task completion: up to 5 before and 5 after photos (10 in total). Mirrors the API limit. */
export const MAX_PHOTOS_PER_STAGE = 5;

export type PhotoStageName = "before" | "after";

/**
 * Keep only as many newly picked photos as still fit in the stage. Returns the photos to add and,
 * when some were dropped, a message explaining why.
 */
export function fitToStageLimit<T>(
  current: number,
  picked: T[],
  stage: PhotoStageName,
): { accepted: T[]; notice: string | null } {
  const room = Math.max(0, MAX_PHOTOS_PER_STAGE - current);
  const accepted = picked.slice(0, room);
  const notice =
    accepted.length < picked.length
      ? `You can add up to ${MAX_PHOTOS_PER_STAGE} ${stage} photos, so ${picked.length - accepted.length} ${
          picked.length - accepted.length === 1 ? "wasn't" : "weren't"
        } added.`
      : null;
  return { accepted, notice };
}

const MAX_EDGE = 1600;
const RESIZABLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SMALL_ENOUGH_BYTES = 1_500_000;

/**
 * Downscale a camera/gallery photo before upload (longest edge 1600 px, JPEG), like the mobile app,
 * so 10 full-resolution phone photos don't make the upload slow or hit size limits. Any image the
 * browser can't decode (e.g. HEIC on some browsers) is sent unchanged.
 */
async function downscalePhoto(file: File): Promise<File> {
  if (!RESIZABLE_TYPES.has(file.type) || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= MAX_EDGE && file.size <= SMALL_ENOUGH_BYTES) {
      bitmap.close();
      return file;
    }
    const scale = Math.min(1, MAX_EDGE / longest);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    if (!blob || blob.size >= file.size) return file;
    const name = `${file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg`;
    return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file;
  }
}

export function preparePhotos(files: File[]): Promise<File[]> {
  return Promise.all(files.map(downscalePhoto));
}
