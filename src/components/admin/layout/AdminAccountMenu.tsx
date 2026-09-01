"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, KeyRound, Mail, Shield, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminAccount = {
  name: string;
  email: string;
  role: string;
};

export function AdminAccountMenu({ account }: { account: AdminAccount }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = (account.name.trim()[0] || account.role[0] || "A").toUpperCase();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-navy transition hover:bg-navy/5"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-white">
          {initial}
        </span>
        <span>{account.role}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Account details"
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-navy/10 bg-white p-4 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-navy">{account.name}</p>
              <p className="mt-0.5 text-xs text-muted">{account.role}</p>
            </div>
          </div>

          <dl className="mt-4 space-y-3 border-t border-navy/10 pt-3 text-sm">
            <div className="flex items-start gap-2.5">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Name</dt>
                <dd className="break-words text-navy">{account.name}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Email</dt>
                <dd className="break-all text-navy">{account.email || "—"}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Role</dt>
                <dd className="text-navy">{account.role}</dd>
              </div>
            </div>
          </dl>
          <Link
            href="/admin/settings#change-password"
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center gap-2 rounded-lg border border-navy/10 px-3 py-2 text-sm font-medium text-navy transition hover:bg-navy/5"
          >
            <KeyRound className="h-4 w-4 text-muted" />
            Change password
          </Link>
        </div>
      ) : null}
    </div>
  );
}
