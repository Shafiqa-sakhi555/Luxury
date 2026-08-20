import {
  formatStatusLabel,
  handoffStatusTone,
  orderStatusTone,
  productStatusTone,
  stockStatusTone,
  type AdminBadgeTone,
} from "@/lib/admin/status-badges";
import { AdminBadge } from "./AdminBadge";

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <AdminBadge tone={orderStatusTone(status)} dot>
      {formatStatusLabel(status)}
    </AdminBadge>
  );
}

export function ProductStatusBadge({ status }: { status: string }) {
  return (
    <AdminBadge tone={productStatusTone(status)} dot>
      {formatStatusLabel(status)}
    </AdminBadge>
  );
}

export function StockStatusBadge({ status }: { status: string }) {
  return (
    <AdminBadge tone={stockStatusTone(status)} dot>
      {formatStatusLabel(status)}
    </AdminBadge>
  );
}

export function HandoffStatusBadge({ status }: { status: string }) {
  return (
    <AdminBadge tone={handoffStatusTone(status)} dot>
      {formatStatusLabel(status)}
    </AdminBadge>
  );
}

export function AdminStatusBadge({
  status,
  tone,
}: {
  status: string;
  tone?: AdminBadgeTone;
}) {
  return (
    <AdminBadge tone={tone ?? "default"} dot>
      {formatStatusLabel(status)}
    </AdminBadge>
  );
}
