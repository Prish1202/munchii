CREATE OR REPLACE FUNCTION public.outlet_accepts_pickup(_restaurant_id uuid, _pickup timestamptz)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record; _local timestamp; _day text; _cfg jsonb; _t time; _from time; _to time;
BEGIN
  SELECT is_active, weekly_hours INTO r FROM restaurants WHERE id = _restaurant_id;
  IF NOT FOUND OR NOT r.is_active THEN RETURN false; END IF;
  IF r.weekly_hours IS NULL THEN RETURN true; END IF;
  _local := COALESCE(_pickup, now()) AT TIME ZONE 'Asia/Kolkata';
  _day := trim(to_char(_local, 'FMDay'));
  _cfg := r.weekly_hours -> _day;
  IF _cfg IS NULL THEN RETURN true; END IF;
  IF NOT COALESCE((_cfg->>'open')::boolean, true) THEN RETURN false; END IF;
  _t := _local::time; _from := (_cfg->>'from')::time; _to := (_cfg->>'to')::time;
  IF _from IS NULL OR _to IS NULL THEN RETURN true; END IF;
  IF _to > _from THEN RETURN _t >= _from AND _t <= _to; END IF;
  RETURN _t >= _from OR _t <= _to;
END $$;
REVOKE EXECUTE ON FUNCTION public.outlet_accepts_pickup(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.outlet_accepts_pickup(uuid, timestamptz) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_outlet_open_on_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.outlet_accepts_pickup(NEW.restaurant_id, NEW.pickup_time) THEN
    RAISE EXCEPTION 'OUTLET_CLOSED: This outlet is offline or closed at the selected pickup time';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.enforce_outlet_open_on_order() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_outlet_open_on_order ON public.orders;
CREATE TRIGGER trg_enforce_outlet_open_on_order BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_outlet_open_on_order();