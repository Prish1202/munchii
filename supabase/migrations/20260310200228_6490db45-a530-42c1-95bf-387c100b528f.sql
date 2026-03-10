
-- Add onboarding columns to restaurants table
alter table public.restaurants
  add column if not exists verification_status text not null default 'verified',
  add column if not exists fssai_license text,
  add column if not exists gst_number text,
  add column if not exists contact_phone text,
  add column if not exists photo_url text,
  add column if not exists area text,
  add column if not exists university_name text,
  add column if not exists opening_hours text,
  add column if not exists closing_hours text;

-- Restaurant owner details (PAN, Aadhaar, contact)
create table public.restaurant_owner_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  pan_number text,
  aadhaar_number text,
  contact_phone text,
  contact_email text,
  full_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.restaurant_owner_details enable row level security;

create policy "Owners can view own details" on public.restaurant_owner_details for select using (auth.uid() = user_id);
create policy "Owners can insert own details" on public.restaurant_owner_details for insert with check (auth.uid() = user_id);
create policy "Owners can update own details" on public.restaurant_owner_details for update using (auth.uid() = user_id);
create policy "Admins can manage owner details" on public.restaurant_owner_details for all using (has_role(auth.uid(), 'admin'));

-- Restaurant bank details
create table public.restaurant_bank_details (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references public.restaurants(id) on delete cascade,
  account_holder_name text,
  account_number text,
  ifsc_code text,
  bank_name text,
  upi_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.restaurant_bank_details enable row level security;

create policy "Owners can view own bank details" on public.restaurant_bank_details for select using (exists (select 1 from restaurants where restaurants.id = restaurant_bank_details.restaurant_id and restaurants.owner_id = auth.uid()));
create policy "Owners can insert bank details" on public.restaurant_bank_details for insert with check (exists (select 1 from restaurants where restaurants.id = restaurant_bank_details.restaurant_id and restaurants.owner_id = auth.uid()));
create policy "Owners can update bank details" on public.restaurant_bank_details for update using (exists (select 1 from restaurants where restaurants.id = restaurant_bank_details.restaurant_id and restaurants.owner_id = auth.uid()));
create policy "Admins can manage bank details" on public.restaurant_bank_details for all using (has_role(auth.uid(), 'admin'));
