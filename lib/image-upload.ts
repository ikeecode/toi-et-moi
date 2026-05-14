export const MAX_IMAGE_UPLOAD_FILES = 20;
export const MAX_IMAGE_UPLOAD_FILE_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_TOTAL_SIZE_BYTES = 40 * 1024 * 1024;

type UploadFileLike = {
  name: string;
  size: number;
  type: string;
};

function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function getImageUploadHint(): string {
  return `Jusqu'a ${MAX_IMAGE_UPLOAD_FILES} photos, ${formatMegabytes(
    MAX_IMAGE_UPLOAD_FILE_SIZE_BYTES
  )} max par photo, ${formatMegabytes(
    MAX_IMAGE_UPLOAD_TOTAL_SIZE_BYTES
  )} max par envoi.`;
}

export function validateImageUpload(files: UploadFileLike[]): string | null {
  if (files.length === 0) {
    return null;
  }

  if (files.length > MAX_IMAGE_UPLOAD_FILES) {
    return `Ajoutez jusqu'a ${MAX_IMAGE_UPLOAD_FILES} photos par envoi.`;
  }

  let totalSize = 0;

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return 'Seuls les fichiers image sont acceptes.';
    }

    if (file.size > MAX_IMAGE_UPLOAD_FILE_SIZE_BYTES) {
      return `Chaque photo doit rester sous ${formatMegabytes(
        MAX_IMAGE_UPLOAD_FILE_SIZE_BYTES
      )}.`;
    }

    totalSize += file.size;
  }

  if (totalSize > MAX_IMAGE_UPLOAD_TOTAL_SIZE_BYTES) {
    return `L'envoi total doit rester sous ${formatMegabytes(
      MAX_IMAGE_UPLOAD_TOTAL_SIZE_BYTES
    )}.`;
  }

  return null;
}
