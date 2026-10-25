-- YOKA Web ver.0.1 初期マイグレーション
-- 既存テーブルを削除・変更しない（すべて IF NOT EXISTS / 追加のみ）。
-- 実行場所: Supabase Dashboard > SQL Editor

create extension if not exists pgcrypto;

-- updated_at 自動更新
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ─────────────────────────────────────────
-- municipalities: 全国地方公共団体コード（参照用・公開読み取り）
-- データ投入は YOKA_SETUP_GUIDE.md の手順を参照
-- ─────────────────────────────────────────
create table if not exists public.municipalities (
  code        text primary key check (code ~ '^[0-9]{5}$'),
  pref_code   text not null check (pref_code ~ '^[0-9]{2}$'),
  pref_name   text not null,
  name        text not null,
  lat         double precision,
  lon         double precision,
  updated_at  timestamptz not null default now()
);
create index if not exists municipalities_pref_idx on public.municipalities (pref_code);
alter table public.municipalities enable row level security;
drop policy if exists "municipalities_public_read" on public.municipalities;
create policy "municipalities_public_read" on public.municipalities for select using (true);

-- ─────────────────────────────────────────
-- profiles: ユーザーごとのプロフィールと選択地域
-- ─────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text check (char_length(display_name) <= 40),
  muni_code     text check (muni_code is null or muni_code ~ '^[0-9]{5}$'),
  pref_name     text,
  muni_name     text,
  lat           double precision,
  lon           double precision,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ─────────────────────────────────────────
-- calendar_events: 個人カレンダー
-- ─────────────────────────────────────────
create table if not exists public.calendar_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 100),
  note        text check (char_length(note) <= 1000),
  all_day     boolean not null default false,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint calendar_events_range check (ends_at >= starts_at)
);
create index if not exists calendar_events_user_time_idx on public.calendar_events (user_id, starts_at);
drop trigger if exists calendar_events_updated_at on public.calendar_events;
create trigger calendar_events_updated_at before update on public.calendar_events for each row execute function public.set_updated_at();
alter table public.calendar_events enable row level security;
drop policy if exists "events_select_own" on public.calendar_events;
drop policy if exists "events_insert_own" on public.calendar_events;
drop policy if exists "events_update_own" on public.calendar_events;
drop policy if exists "events_delete_own" on public.calendar_events;
create policy "events_select_own" on public.calendar_events for select to authenticated using (user_id = auth.uid());
create policy "events_insert_own" on public.calendar_events for insert to authenticated with check (user_id = auth.uid());
create policy "events_update_own" on public.calendar_events for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "events_delete_own" on public.calendar_events for delete to authenticated using (user_id = auth.uid());

-- ─────────────────────────────────────────
-- local_content: まち情報・チラシ・お知らせ（将来の店舗投稿を想定）
-- ver.0.1 ではアプリから書き込まない。公開済みのみ読み取り可。
-- ─────────────────────────────────────────
create table if not exists public.local_content (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('machi','flyer','notice','event')),
  muni_code     text check (muni_code is null or muni_code ~ '^[0-9]{5}$'),
  shop_name     text not null check (char_length(shop_name) <= 100),
  category      text check (char_length(category) <= 40),
  title         text not null check (char_length(title) <= 120),
  body          text check (char_length(body) <= 3000),
  image_url     text,
  lat           double precision,
  lon           double precision,
  is_sample     boolean not null default false,
  status        text not null default 'draft' check (status in ('draft','published','archived')),
  owner_id      uuid references auth.users(id) on delete set null,  -- 将来の店舗アカウント
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists local_content_muni_kind_idx on public.local_content (muni_code, kind, published_at desc);
drop trigger if exists local_content_updated_at on public.local_content;
create trigger local_content_updated_at before update on public.local_content for each row execute function public.set_updated_at();
alter table public.local_content enable row level security;
drop policy if exists "local_content_public_read" on public.local_content;
create policy "local_content_public_read" on public.local_content for select using (status = 'published');

-- ─────────────────────────────────────────
-- partner_inquiries: 掲載・連携の問い合わせ（書き込みのみ。公開読み取り不可）
-- ─────────────────────────────────────────
create table if not exists public.partner_inquiries (
  id            uuid primary key default gen_random_uuid(),
  org_name      text not null check (char_length(org_name) between 1 and 100),
  contact_name  text not null check (char_length(contact_name) between 1 and 60),
  email         text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  inquiry_type  text not null check (inquiry_type in ('municipality','store','shop','company','other')),
  body          text not null check (char_length(body) between 10 and 3000),
  status        text not null default 'new' check (status in ('new','in_progress','closed')),
  created_at    timestamptz not null default now()
);
create index if not exists partner_inquiries_created_idx on public.partner_inquiries (created_at desc);
alter table public.partner_inquiries enable row level security;
drop policy if exists "inquiries_insert_anyone" on public.partner_inquiries;
create policy "inquiries_insert_anyone" on public.partner_inquiries for insert to anon, authenticated
  with check (status = 'new');
-- select / update / delete のポリシーは作らない（Dashboard / service_role のみ閲覧）
revoke select, update, delete on public.partner_inquiries from anon, authenticated;

-- ─────────────────────────────────────────
-- アカウント削除: 本人のみ実行可。auth.users 削除で関連データは cascade 削除
-- ─────────────────────────────────────────
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from public.calendar_events where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
