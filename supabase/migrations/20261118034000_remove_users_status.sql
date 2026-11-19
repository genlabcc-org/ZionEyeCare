-- Customer accounts no longer have an application-level active/disabled status.
ALTER TABLE public.users DROP COLUMN IF EXISTS status;
