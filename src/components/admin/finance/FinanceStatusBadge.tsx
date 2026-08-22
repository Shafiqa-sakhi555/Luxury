import { AdminBadge } from "@/components/admin/ui";
import { formatFinanceStatus, paymentStatusTone } from "@/lib/finance/display";

export function FinanceStatusBadge({ status }: { status: string }) {
  return (
    <AdminBadge tone={paymentStatusTone(status)} dot>
      {formatFinanceStatus(status)}
    </AdminBadge>
  );
}
