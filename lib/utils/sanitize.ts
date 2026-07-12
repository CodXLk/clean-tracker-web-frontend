// Use only when dangerouslySetInnerHTML is unavoidable — prefer React's default escaping.
// Install dompurify + @types/dompurify if this file is needed in production.

export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined") {
    // Server-side: strip all tags as a safe fallback
    return dirty.replace(/<[^>]*>/g, "");
  }
  // Client-side: use DOMPurify when installed
  // import DOMPurify from "dompurify";
  // return DOMPurify.sanitize(dirty);
  return dirty.replace(/<[^>]*>/g, "");
}
