
create or replace function public.get_leaderboard_top10()
returns table (
  user_id uuid,
  total_coins numeric,
  name text,
  username text,
  avatar_url text,
  campus text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    w.user_id,
    w.total_coins,
    p.name,
    p.username,
    p.avatar_url,
    p.campus
  from user_wallet w
  join profiles p on p.id = w.user_id
  where w.total_coins > 0
  order by w.total_coins desc
  limit 10;
$$;
