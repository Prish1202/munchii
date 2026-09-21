ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS preparation_time_minutes integer NOT NULL DEFAULT 10;

ALTER TABLE public.menu_items
  DROP CONSTRAINT IF EXISTS menu_items_preparation_time_minutes_range;

ALTER TABLE public.menu_items
  ADD CONSTRAINT menu_items_preparation_time_minutes_range
  CHECK (preparation_time_minutes BETWEEN 1 AND 180);

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS preparation_buffer_minutes integer NOT NULL DEFAULT 5;

ALTER TABLE public.restaurants
  DROP CONSTRAINT IF EXISTS restaurants_preparation_buffer_minutes_range;

ALTER TABLE public.restaurants
  ADD CONSTRAINT restaurants_preparation_buffer_minutes_range
  CHECK (preparation_buffer_minutes BETWEEN 0 AND 60);