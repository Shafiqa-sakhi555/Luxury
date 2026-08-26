"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  orderNumber: string;
  customerName: string;
  totalLabel: string;
  status: string;
  createdAt: string;
  unread: boolean;
};

function timeAgo(iso: string) {
  const delta = Date.now() - Date.parse(iso);
  if (!Number.isFinite(delta) || delta < 0) return "just now";
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const SEEN_KEY = "jalals-admin-orders-seen-at";

export function AdminOrderBell() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const seenAt = window.localStorage.getItem(SEEN_KEY);
      const query = seenAt ? `?seenAt=${encodeURIComponent(seenAt)}` : "";
      const response = await fetch(`/api/admin/order-notifications${query}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { items?: NotificationItem[]; unreadCount?: number };
      setItems(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Keep the last known count if the poll fails.
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 20000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function openPanel() {
    const next = !open;
    setOpen(next);
    if (!next) return;
    if (unreadCount > 0) {
      const now = new Date().toISOString();
      window.localStorage.setItem(SEEN_KEY, now);
      setUnreadCount(0);
      setItems((current) => current.map((item) => ({ ...item, unread: false })));
      await fetch("/api/admin/order-notifications", { method: "POST" }).catch(() => undefined);
    }
    void load();
  }

  const badge = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => void openPanel()}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unreadCount > 0 ? `${unreadCount} new order notifications` : "Order notifications"}
        className="relative rounded-lg p-2 text-navy transition hover:bg-navy/5"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-semibold leading-none text-white">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Order notifications"
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-navy/10 bg-white shadow-xl"
        >
          <div className="border-b border-navy/10 px-4 py-3">
            <p className="text-sm font-semibold text-navy">Orders</p>
            <p className="text-xs text-muted">New customer orders appear here.</p>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="border-b border-navy/5 last:border-b-0">
                  <Link
                    href={`/admin/orders/${item.id}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block px-4 py-3 hover:bg-navy/5",
                      item.unread && "bg-red/5"
                    )}
                  >
                    <p className="text-sm font-medium text-navy">
                      New order {item.orderNumber}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {item.customerName} · {item.totalLabel}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">{timeAgo(item.createdAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-navy/10 px-4 py-2">
            <Link
              href="/admin/orders"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-navy hover:underline"
            >
              View all orders
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
