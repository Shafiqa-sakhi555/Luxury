export async function addItemToCart(
  variantId: string,
  quantity = 1,
  customization?: Record<string, unknown>
) {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ variantId, quantity, customization }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to add to cart");
  }
  return data;
}
