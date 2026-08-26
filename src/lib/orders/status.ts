export type OrderStatusCode =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export const ORDER_STATUS_FLOW: OrderStatusCode[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
];

type OrderStatusMeta = {
  label: string;
  customerLabel: string;
  meaning: string;
  nextSteps: string;
};

export const ORDER_STATUS_META: Record<OrderStatusCode, OrderStatusMeta> = {
  PENDING: {
    label: "Pending",
    customerLabel: "Awaiting confirmation",
    meaning: "Order received and awaiting staff confirmation.",
    nextSteps: "We will confirm your order shortly. You may receive a call for COD verification.",
  },
  CONFIRMED: {
    label: "Confirmed",
    customerLabel: "Confirmed",
    meaning: "Order accepted and queued for fulfilment.",
    nextSteps: "Your order is in our fulfilment queue.",
  },
  PROCESSING: {
    label: "Processing",
    customerLabel: "Processing",
    meaning: "Order is being prepared — picking and packing.",
    nextSteps: "No action needed unless we contact you.",
  },
  PACKED: {
    label: "Packed",
    customerLabel: "Packed",
    meaning: "Order packed and ready for dispatch.",
    nextSteps: "Await shipping notification.",
  },
  SHIPPED: {
    label: "Shipped",
    customerLabel: "Shipped",
    meaning: "Order dispatched and in transit.",
    nextSteps: "Watch for delivery confirmation call or email.",
  },
  DELIVERED: {
    label: "Delivered",
    customerLabel: "Delivered",
    meaning: "Order delivered to customer.",
    nextSteps: "Inspect items on arrival. Report damage within 48 hours if needed.",
  },
  CANCELLED: {
    label: "Cancelled",
    customerLabel: "Cancelled",
    meaning: "This order was cancelled and will not be delivered.",
    nextSteps: "COD is not collected. If you still want these items, you can place a new order.",
  },
};

export function getOrderStatusMeta(status: string): OrderStatusMeta {
  const key = status as OrderStatusCode;
  return (
    ORDER_STATUS_META[key] ?? {
      label: status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
      customerLabel: status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
      meaning: "Order status update.",
      nextSteps: "Check back here for updates.",
    }
  );
}

export function customerOrderStatusLabel(status: string): string {
  return getOrderStatusMeta(status).customerLabel;
}

export function customerOrderStatusTone(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    case "CONFIRMED":
    case "PROCESSING":
      return "bg-blue-50 text-blue-800 ring-blue-200";
    case "PACKED":
    case "SHIPPED":
      return "bg-violet-50 text-violet-800 ring-violet-200";
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "CANCELLED":
      return "bg-red-50 text-red-800 ring-red-200";
    default:
      return "bg-neutral-50 text-neutral-700 ring-neutral-200";
  }
}

/** Customers may cancel only before packing and dispatch. */
export const CUSTOMER_CANCELLABLE_STATUSES: readonly OrderStatusCode[] = ["PENDING", "CONFIRMED"];

export function canCustomerCancelOrder(status: string) {
  return CUSTOMER_CANCELLABLE_STATUSES.includes(status as OrderStatusCode);
}
