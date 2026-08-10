export const CONTENT_PREFIX = "content/";
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export type ContentItem = {
  id: string;
  pathname: string;
  title: string;
  url: string;
  uploadedAt: string;
  size: number;
};

/**
 * Reduce an arbitrary user filename to a URL-safe slug so the blob pathname
 * (and the /content/[id] route derived from it) never needs escaping.
 */
export function sanitizeFilename(filename: string): string {
  const withoutExtension = filename.replace(/\.html?$/i, "");
  const slug = withoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "untitled";
}

export function buildPathname(filename: string): string {
  return `${CONTENT_PREFIX}${Date.now()}-${sanitizeFilename(filename)}.html`;
}

/** id is the pathname without the "content/" prefix and ".html" suffix. */
export function idFromPathname(pathname: string): string {
  return pathname.slice(CONTENT_PREFIX.length).replace(/\.html$/, "");
}

export function pathnameFromId(id: string): string {
  return `${CONTENT_PREFIX}${id}.html`;
}

/** "1712345678-weather-dashboard" -> "weather dashboard" */
export function titleFromPathname(pathname: string): string {
  return idFromPathname(pathname)
    .replace(/^\d+-/, "")
    .replace(/-/g, " ");
}

export function isValidId(id: string): boolean {
  return /^[a-z0-9-]+$/.test(id);
}
