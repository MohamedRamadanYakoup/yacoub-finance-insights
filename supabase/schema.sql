-- =====================================================================
-- FINANCE INSIGHTS — Supabase schema
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- =====================================================================

-- 1. Tables ------------------------------------------------------------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  issue       int,
  title       text not null,
  excerpt     text default '',
  content     text default '',
  category    text default 'Finance',
  tags        text[] default '{}',
  cover_img   text,
  series      boolean default true,
  status      text not null default 'draft' check (status in ('draft','scheduled','published')),
  publish_at  timestamptz,
  views       int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists posts_publish_idx on public.posts (status, publish_at desc);

create table if not exists public.settings (
  id   int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb
);
insert into public.settings (id, data) values (1, '{
  "blogName":"Finance Insights",
  "tagline":"Weekly insights for finance professionals.",
  "author":"Mohamed Yacoub",
  "role":"Author of the Finance Insights LinkedIn newsletter",
  "linkedin":"https://www.linkedin.com/",
  "weeklyDay":6, "weeklyTime":"08:00", "showUpcoming":true
}'::jsonb) on conflict (id) do nothing;

create table if not exists public.activity (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  icon    text,
  message text
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- 2. Helper: is the signed-in user an admin? ---------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- 3. Row Level Security ------------------------------------------------
alter table public.posts    enable row level security;
alter table public.settings enable row level security;
alter table public.activity enable row level security;
alter table public.admins   enable row level security;

-- Visitors can read published issues, and scheduled issues once their time has passed
drop policy if exists "public reads live posts" on public.posts;
create policy "public reads live posts" on public.posts for select
  using (status = 'published' or (status = 'scheduled' and publish_at <= now()));

drop policy if exists "admin manages posts" on public.posts;
create policy "admin manages posts" on public.posts for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public reads settings" on public.settings;
create policy "public reads settings" on public.settings for select using (true);
drop policy if exists "admin writes settings" on public.settings;
create policy "admin writes settings" on public.settings for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin activity" on public.activity;
create policy "admin activity" on public.activity for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin reads admins" on public.admins;
create policy "admin reads admins" on public.admins for select using (public.is_admin());

-- 4. "Coming up" teaser: title/date only of future scheduled issues ----
create or replace view public.upcoming_posts as
  select issue, title, category, publish_at
  from public.posts
  where status = 'scheduled' and publish_at > now();
grant select on public.upcoming_posts to anon, authenticated;

-- 5. Read counter (visitors can add +1 to a live issue, nothing else) --
create or replace function public.increment_views(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.posts set views = views + 1
  where id = p_id and (status = 'published' or (status = 'scheduled' and publish_at <= now()));
$$;
grant execute on function public.increment_views(uuid) to anon, authenticated;

-- 6. Auto-publish: flip due scheduled issues to published every 5 minutes
--    (Visitors already see due issues instantly through the policy above;
--     this just keeps the status column tidy.)
create extension if not exists pg_cron;
select cron.unschedule('fi-autopublish') where exists (select 1 from cron.job where jobname = 'fi-autopublish');
select cron.schedule('fi-autopublish', '*/5 * * * *',
  $$update public.posts set status = 'published', updated_at = now()
    where status = 'scheduled' and publish_at <= now()$$);

-- 7. Storage bucket for cover images / thumbnails (public read, admin write)
insert into storage.buckets (id, name, public) values ('covers', 'covers', true)
  on conflict (id) do nothing;
drop policy if exists "admin uploads covers" on storage.objects;
create policy "admin uploads covers" on storage.objects for all to authenticated
  using (bucket_id = 'covers' and public.is_admin())
  with check (bucket_id = 'covers' and public.is_admin());

-- =====================================================================
-- AFTER you create your login user (Authentication → Users → Add user),
-- make it an admin — replace the email and run:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com';
-- =====================================================================
