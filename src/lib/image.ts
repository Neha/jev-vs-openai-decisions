const DATA_URL =
  /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/** Keep payloads under typical App Router body limits after JPEG compression. */
export const MAX_IMAGE_DATA_URL_CHARS = 1_400_000;

export function isImageDataUrl(value: string): boolean {
  return (
    DATA_URL.test(value) &&
    value.length > "data:image/png;base64,".length &&
    value.length <= MAX_IMAGE_DATA_URL_CHARS
  );
}
