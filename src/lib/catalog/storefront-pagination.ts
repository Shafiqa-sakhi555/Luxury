/** 4 cards per row on desktop × 3 rows */
export const STOREFRONT_PRODUCT_PAGE_SIZE = 12;
/** 4 cards per row on desktop × 2 rows */
export const STOREFRONT_CATEGORY_PAGE_SIZE = 8;
export const HOMEPAGE_CATEGORY_PAGE_SIZE = STOREFRONT_CATEGORY_PAGE_SIZE;
export const HOMEPAGE_PRODUCT_PAGE_SIZE = STOREFRONT_PRODUCT_PAGE_SIZE;
export const HOMEPAGE_PRODUCT_FETCH_SIZE = 48;

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}
