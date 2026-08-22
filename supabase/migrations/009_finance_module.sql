-- Finance module: transactions, refunds, invoices, settlements, reconciliation

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders (id) ON DELETE CASCADE,
  transaction_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers (id) ON DELETE SET NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PKR',
  payment_method TEXT NOT NULL DEFAULT 'COD',
  payment_provider TEXT NOT NULL DEFAULT 'cod',
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  gateway_fee_minor INTEGER NOT NULL DEFAULT 0,
  tax_minor INTEGER NOT NULL DEFAULT 0,
  refund_amount_minor INTEGER NOT NULL DEFAULT 0,
  net_amount_minor INTEGER NOT NULL,
  failure_reason TEXT,
  provider_reference TEXT,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders (id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers (id) ON DELETE SET NULL,
  subtotal_minor INTEGER NOT NULL,
  discount_minor INTEGER NOT NULL DEFAULT 0,
  delivery_minor INTEGER NOT NULL DEFAULT 0,
  tax_minor INTEGER NOT NULL DEFAULT 0,
  total_minor INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  status TEXT NOT NULL DEFAULT 'ISSUED',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_number TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES public.orders (id) ON DELETE RESTRICT,
  transaction_id UUID REFERENCES public.financial_transactions (id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers (id) ON DELETE SET NULL,
  original_amount_minor INTEGER NOT NULL,
  requested_amount_minor INTEGER NOT NULL,
  approved_amount_minor INTEGER,
  refunded_amount_minor INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  return_status TEXT NOT NULL DEFAULT 'PENDING_RETURN',
  status TEXT NOT NULL DEFAULT 'PENDING_ADMIN',
  requested_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  reviewed_by_admin UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  reviewed_by_finance UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  admin_notes TEXT,
  finance_notes TEXT,
  rejection_reason TEXT,
  provider_reference TEXT,
  provider_result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_number TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'cod',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_amount_minor INTEGER NOT NULL DEFAULT 0,
  fee_amount_minor INTEGER NOT NULL DEFAULT 0,
  refund_amount_minor INTEGER NOT NULL DEFAULT 0,
  adjustment_amount_minor INTEGER NOT NULL DEFAULT 0,
  net_amount_minor INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PKR',
  status TEXT NOT NULL DEFAULT 'PENDING',
  settlement_reference TEXT,
  settled_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_reconciliation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID REFERENCES public.finance_settlements (id) ON DELETE SET NULL,
  expected_amount_minor INTEGER NOT NULL,
  actual_amount_minor INTEGER NOT NULL,
  difference_minor INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  reconciled_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON public.financial_transactions (payment_status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions (transaction_date);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests (status);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices (status);
CREATE INDEX IF NOT EXISTS idx_finance_settlements_period ON public.finance_settlements (period_start, period_end);

-- Backfill transactions + invoices from existing orders
INSERT INTO public.financial_transactions (
  order_id,
  transaction_number,
  customer_id,
  amount_minor,
  currency,
  payment_method,
  payment_provider,
  payment_status,
  tax_minor,
  refund_amount_minor,
  net_amount_minor,
  transaction_date
)
SELECT
  o.id,
  'TXN-' || UPPER(SUBSTRING(REPLACE(o.id::text, '-', ''), 1, 10)),
  o.customer_id,
  o.total_minor,
  'PKR',
  COALESCE(o.payment_method, 'COD'),
  CASE WHEN COALESCE(o.payment_method, 'COD') = 'COD' THEN 'cod' ELSE 'manual' END,
  CASE
    WHEN o.status = 'CANCELLED' THEN 'CANCELLED'
    WHEN o.payment_status IN ('PAID', 'REFUNDED', 'PARTIALLY_REFUNDED') THEN o.payment_status
    WHEN o.status = 'DELIVERED' AND COALESCE(o.payment_method, 'COD') = 'COD' THEN 'SUCCESSFUL'
    WHEN o.status IN ('CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED') THEN 'PENDING'
    ELSE 'PENDING'
  END,
  COALESCE(o.tax_minor, 0),
  0,
  o.total_minor,
  o.created_at
FROM public.orders o
ON CONFLICT (order_id) DO NOTHING;

INSERT INTO public.invoices (
  order_id,
  invoice_number,
  customer_id,
  subtotal_minor,
  discount_minor,
  delivery_minor,
  tax_minor,
  total_minor,
  payment_status,
  status,
  issued_at
)
SELECT
  o.id,
  'INV-' || o.order_number,
  o.customer_id,
  o.subtotal_minor,
  COALESCE(o.discount_minor, 0),
  COALESCE(o.delivery_minor, 0),
  COALESCE(o.tax_minor, 0),
  o.total_minor,
  CASE
    WHEN o.status = 'DELIVERED' OR o.payment_status = 'PAID' THEN 'PAID'
    WHEN o.status = 'CANCELLED' THEN 'VOID'
    ELSE 'UNPAID'
  END,
  CASE WHEN o.status = 'CANCELLED' THEN 'VOID' ELSE 'ISSUED' END,
  o.created_at
FROM public.orders o
ON CONFLICT (order_id) DO NOTHING;

-- Finance permissions
INSERT INTO public.permissions (key, description) VALUES
  ('finance.dashboard.view', 'View finance dashboard'),
  ('transactions.view', 'View financial transactions'),
  ('payments.view', 'View payments'),
  ('refunds.view', 'View refund requests'),
  ('refunds.create', 'Create refund requests'),
  ('refunds.approve', 'Approve refund requests'),
  ('refunds.reject', 'Reject refund requests'),
  ('invoices.view', 'View invoices'),
  ('invoices.download', 'Download invoices'),
  ('payouts.view', 'View payouts/settlements'),
  ('settlements.view', 'View settlements'),
  ('reconciliation.view', 'View reconciliation'),
  ('reconciliation.manage', 'Manage reconciliation'),
  ('financial_reports.view', 'View financial reports'),
  ('financial_reports.export', 'Export financial reports')
ON CONFLICT (key) DO NOTHING;

-- Link Finance role permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Finance'
  AND p.key IN (
    'finance.read',
    'finance.dashboard.view',
    'transactions.view',
    'payments.view',
    'refunds.view',
    'refunds.approve',
    'refunds.reject',
    'invoices.view',
    'invoices.download',
    'payouts.view',
    'settlements.view',
    'reconciliation.view',
    'reconciliation.manage',
    'financial_reports.view',
    'financial_reports.export',
    'order.read',
    'customer.read'
  )
ON CONFLICT DO NOTHING;

-- Admin gets refund create only (not approve)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Admin'
  AND p.key IN ('refunds.create', 'refunds.view', 'invoices.view')
ON CONFLICT DO NOTHING;
