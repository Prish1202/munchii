
-- 1) Remove duplicate triggers (keep one per workflow)
DROP TRIGGER IF EXISTS on_order_completed_reward ON public.orders;
DROP TRIGGER IF EXISTS trigger_auto_complete_on_pickup ON public.orders;
DROP TRIGGER IF EXISTS trg_auto_refund_cancel ON public.orders;
DROP TRIGGER IF EXISTS trg_auto_refund_on_cancel ON public.orders;
DROP TRIGGER IF EXISTS trigger_notify_new_order ON public.orders;
DROP TRIGGER IF EXISTS trigger_notify_order_status ON public.orders;
DROP TRIGGER IF EXISTS trg_push_on_notification ON public.notifications;
DROP TRIGGER IF EXISTS trigger_push_on_notification_insert ON public.notifications;
DROP TRIGGER IF EXISTS on_profile_created_wallet ON public.profiles;

-- 2) Encryption key in Vault
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'pii_encryption_key') THEN
    PERFORM vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'), 'pii_encryption_key');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public._pii_key() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, vault AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='pii_encryption_key' LIMIT 1 $$;
REVOKE ALL ON FUNCTION public._pii_key() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public._pii_mask(v text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN v IS NULL OR v = '' THEN NULL ELSE '••••' || right(v, 4) END $$;

ALTER TABLE public.restaurant_owner_details
  ADD COLUMN IF NOT EXISTS pan_enc bytea, ADD COLUMN IF NOT EXISTS aadhaar_enc bytea;
ALTER TABLE public.restaurant_bank_details
  ADD COLUMN IF NOT EXISTS account_number_enc bytea, ADD COLUMN IF NOT EXISTS ifsc_enc bytea, ADD COLUMN IF NOT EXISTS upi_enc bytea;

CREATE OR REPLACE FUNCTION public._pii_enc_field(newv text, oldenc bytea, OUT enc bytea, OUT masked text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF newv IS NULL OR newv = '' THEN enc := NULL; masked := NULL;
  ELSIF newv LIKE '••••%' THEN enc := oldenc; masked := newv;   -- unchanged masked value
  ELSE enc := extensions.pgp_sym_encrypt(newv, public._pii_key()); masked := public._pii_mask(newv);
  END IF;
END $$;
REVOKE ALL ON FUNCTION public._pii_enc_field(text, bytea) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.encrypt_owner_details() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public._pii_enc_field(NEW.pan_number, CASE WHEN TG_OP='UPDATE' THEN OLD.pan_enc END);
  NEW.pan_enc := r.enc; NEW.pan_number := r.masked;
  SELECT * INTO r FROM public._pii_enc_field(NEW.aadhaar_number, CASE WHEN TG_OP='UPDATE' THEN OLD.aadhaar_enc END);
  NEW.aadhaar_enc := r.enc; NEW.aadhaar_number := r.masked;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.encrypt_bank_details() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public._pii_enc_field(NEW.account_number, CASE WHEN TG_OP='UPDATE' THEN OLD.account_number_enc END);
  NEW.account_number_enc := r.enc; NEW.account_number := r.masked;
  SELECT * INTO r FROM public._pii_enc_field(NEW.ifsc_code, CASE WHEN TG_OP='UPDATE' THEN OLD.ifsc_enc END);
  NEW.ifsc_enc := r.enc; NEW.ifsc_code := r.masked;
  SELECT * INTO r FROM public._pii_enc_field(NEW.upi_id, CASE WHEN TG_OP='UPDATE' THEN OLD.upi_enc END);
  NEW.upi_enc := r.enc; NEW.upi_id := r.masked;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.encrypt_owner_details() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.encrypt_bank_details() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_encrypt_owner_details ON public.restaurant_owner_details;
CREATE TRIGGER trg_encrypt_owner_details BEFORE INSERT OR UPDATE ON public.restaurant_owner_details
  FOR EACH ROW EXECUTE FUNCTION public.encrypt_owner_details();
DROP TRIGGER IF EXISTS trg_encrypt_bank_details ON public.restaurant_bank_details;
CREATE TRIGGER trg_encrypt_bank_details BEFORE INSERT OR UPDATE ON public.restaurant_bank_details
  FOR EACH ROW EXECUTE FUNCTION public.encrypt_bank_details();

-- Encrypt existing plaintext rows (trigger fires on update)
UPDATE public.restaurant_owner_details SET pan_number = pan_number;
UPDATE public.restaurant_bank_details SET account_number = account_number;

-- Hide ciphertext columns from the API
REVOKE SELECT (pan_enc, aadhaar_enc) ON public.restaurant_owner_details FROM anon, authenticated;
REVOKE SELECT (account_number_enc, ifsc_enc, upi_enc) ON public.restaurant_bank_details FROM anon, authenticated;
REVOKE ALL ON public.restaurant_owner_details FROM anon;
REVOKE ALL ON public.restaurant_bank_details FROM anon;

-- 3) Decrypted reads: owner or admin only
CREATE OR REPLACE FUNCTION public.get_owner_details_decrypted(_user_id uuid)
RETURNS TABLE(pan_number text, aadhaar_number text, contact_phone text, contact_email text, full_address text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR (auth.uid() <> _user_id AND NOT has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY SELECT
    CASE WHEN d.pan_enc IS NULL THEN NULL ELSE extensions.pgp_sym_decrypt(d.pan_enc, public._pii_key()) END,
    CASE WHEN d.aadhaar_enc IS NULL THEN NULL ELSE extensions.pgp_sym_decrypt(d.aadhaar_enc, public._pii_key()) END,
    d.contact_phone, d.contact_email, d.full_address
  FROM public.restaurant_owner_details d WHERE d.user_id = _user_id;
END $$;

CREATE OR REPLACE FUNCTION public.get_bank_details_decrypted(_restaurant_id uuid)
RETURNS TABLE(account_holder_name text, account_number text, ifsc_code text, bank_name text, upi_id text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT (has_role(auth.uid(),'admin')
     OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id=_restaurant_id AND r.owner_id=auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY SELECT b.account_holder_name,
    CASE WHEN b.account_number_enc IS NULL THEN NULL ELSE extensions.pgp_sym_decrypt(b.account_number_enc, public._pii_key()) END,
    CASE WHEN b.ifsc_enc IS NULL THEN NULL ELSE extensions.pgp_sym_decrypt(b.ifsc_enc, public._pii_key()) END,
    b.bank_name,
    CASE WHEN b.upi_enc IS NULL THEN NULL ELSE extensions.pgp_sym_decrypt(b.upi_enc, public._pii_key()) END
  FROM public.restaurant_bank_details b WHERE b.restaurant_id = _restaurant_id;
END $$;
REVOKE ALL ON FUNCTION public.get_owner_details_decrypted(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_bank_details_decrypted(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_owner_details_decrypted(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_bank_details_decrypted(uuid) TO authenticated;

-- 4) Reset RLS to owner + admin only
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public'
    AND tablename IN ('restaurant_owner_details','restaurant_bank_details') LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;
ALTER TABLE public.restaurant_owner_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_bank_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin manage owner details" ON public.restaurant_owner_details
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(),'admin'));

CREATE POLICY "Owner or admin manage bank details" ON public.restaurant_bank_details
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()))
  WITH CHECK (has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));
