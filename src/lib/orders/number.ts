/** Public order IDs look like JHS-853457-Q5QNGL */
export const ORDER_NUMBER_PATTERN = /\b(JHS-\d+-[A-Z0-9]+)\b/i;

export function parseOrderNumber(value: string): string | null {
  const trimmed = value.trim();
  const exact = trimmed.match(/^(JHS-\d+-[A-Z0-9]+)$/i);
  if (exact) return exact[1].toUpperCase();
  const embedded = trimmed.match(ORDER_NUMBER_PATTERN);
  if (embedded && trimmed.replace(/\s+/g, "").toUpperCase() === embedded[1].toUpperCase()) {
    return embedded[1].toUpperCase();
  }
  return null;
}

export function extractOrderNumber(value: string): string | null {
  const match = value.match(ORDER_NUMBER_PATTERN);
  return match ? match[1].toUpperCase() : null;
}
