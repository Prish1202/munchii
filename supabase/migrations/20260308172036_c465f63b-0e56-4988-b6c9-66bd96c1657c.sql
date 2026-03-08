CREATE TABLE IF NOT EXISTS public.user_private_key_backups (
  user_id UUID PRIMARY KEY,
  encrypted_private_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_private_key_backups ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_private_key_backups'
      AND policyname = 'Users can view own private key backup'
  ) THEN
    CREATE POLICY "Users can view own private key backup"
    ON public.user_private_key_backups
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_private_key_backups'
      AND policyname = 'Users can insert own private key backup'
  ) THEN
    CREATE POLICY "Users can insert own private key backup"
    ON public.user_private_key_backups
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_private_key_backups'
      AND policyname = 'Users can update own private key backup'
  ) THEN
    CREATE POLICY "Users can update own private key backup"
    ON public.user_private_key_backups
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_user_private_key_backups_updated_at ON public.user_private_key_backups;
CREATE TRIGGER update_user_private_key_backups_updated_at
BEFORE UPDATE ON public.user_private_key_backups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();