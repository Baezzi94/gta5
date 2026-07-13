-- Black Out 정보부 시스템 초기 스키마
-- 계급/상태는 check constraint로 (enum 대신 — 토킹바 관례)

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_id text,
  char_name text,
  phone text,
  role text check (role in ('boss','vice','branch_head','manager','team_lead','member','intel_chief','intel_agent')),
  status text not null default 'pending' check (status in ('pending','active','expelled')),
  created_at timestamptz not null default now()
);

create table public.categories (
  id bigint generated always as identity primary key,
  name text not null unique
);
insert into public.categories (name) values ('적대조직'),('경찰'),('시민'),('내부'),('기타');

create table public.persons (
  id bigint generated always as identity primary key,
  phone text unique,           -- 불변 키. 미상이면 null 허용
  affiliation text,            -- 소속(자유 텍스트: 갱/시민/경찰 등)
  notes text,
  clearance int not null default 2 check (clearance between 0 and 3),
  created_at timestamptz not null default now()
);

create table public.person_names (
  id bigint generated always as identity primary key,
  person_id bigint not null references public.persons(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (person_id, name)
);

create table public.tips (
  id bigint generated always as identity primary key,
  submitter_id uuid not null references public.profiles(id),
  title text not null,
  body text not null,
  category_id bigint references public.categories(id),
  status text not null default 'received' check (status in ('received','reviewing','adopted','rejected')),
  verdict text not null default 'unverified' check (verdict in ('unverified','true','false','uncertain')),
  clearance int check (clearance between 0 and 3),  -- 확정 전 null
  intel_memo text,             -- 정보부 내부 메모 (제보자에게 비노출)
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table public.tip_photos (
  id bigint generated always as identity primary key,
  tip_id bigint not null references public.tips(id) on delete cascade,
  path text not null           -- storage 'tip-photos' 버킷 내 경로
);

create table public.tip_persons (
  tip_id bigint not null references public.tips(id) on delete cascade,
  person_id bigint not null references public.persons(id) on delete cascade,
  primary key (tip_id, person_id)
);

-- 가입 시 profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, discord_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub'));
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
