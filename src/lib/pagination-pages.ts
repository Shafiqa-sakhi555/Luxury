/** Returns a window of page numbers (max 7) centered around the current page. */
export function getPaginationPages(page: number, totalPages: number, maxVisible = 7): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (page <= 4) {
    return Array.from({ length: maxVisible }, (_, i) => i + 1);
  }

  if (page >= totalPages - 3) {
    return Array.from({ length: maxVisible }, (_, i) => totalPages - maxVisible + 1 + i);
  }

  return Array.from({ length: maxVisible }, (_, i) => page - 3 + i);
}
