import { formatMoney } from "@/lib/money";

export function FinanceMiniChart({
  title,
  series,
  valueKey,
}: {
  title: string;
  series: { date: string; gross: number; net: number; refunds: number }[];
  valueKey: "gross" | "net" | "refunds";
}) {
  const max = Math.max(...series.map((row) => row[valueKey]), 1);

  return (
    <div>
      <h3 className="text-sm font-semibold text-navy">{title}</h3>
      {series.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No data for this period.</p>
      ) : (
        <div className="mt-4 flex items-end gap-1" style={{ height: 120 }}>
          {series.map((row) => {
            const value = row[valueKey];
            const height = Math.max(4, Math.round((value / max) * 100));
            return (
              <div
                key={row.date}
                className="group relative flex-1"
                title={`${row.date}: ${formatMoney(value)}`}
              >
                <div
                  className="w-full rounded-t bg-navy/80 transition group-hover:bg-navy"
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FinanceBreakdownChart({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number; tone?: string }[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div>
      <h3 className="text-sm font-semibold text-navy">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted">{item.label}</span>
              <span className="font-medium text-navy">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-navy/10">
              <div
                className="h-full rounded-full bg-navy"
                style={{ width: `${Math.round((item.value / total) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
