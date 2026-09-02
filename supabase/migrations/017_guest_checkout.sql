-- Guest checkout: keep an email on the order when the customer has no account.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_email TEXT;
