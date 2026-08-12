/** Convert a display name into a URL-safe slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function uniqueProductSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
  currentSlug?: string
): Promise<string> {
  const normalized = slugify(base);
  if (!normalized) return `product-${Date.now()}`;
  if (currentSlug && normalized === currentSlug) return normalized;

  let candidate = normalized;
  let counter = 2;
  while (await exists(candidate)) {
    candidate = `${normalized}-${counter}`;
    counter += 1;
  }
  return candidate;
}
