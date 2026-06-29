-- Enums
create type member_type as enum ('owner','staff','promoter','princess');
create type session_status as enum ('prep','open','closed');
create type reservation_status as enum ('booked','in_progress','done','no_show','cancelled');

-- members: 공주님/스탭/삐끼/사장 프로필
create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  type member_type not null,
  profile_photo_url text,
  referred_by uuid references members(id),
  active boolean not null default true,
  memo text,
  created_at timestamptz not null default now()
);

-- profiles: auth 계정 ↔ member ↔ 역할
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  member_id uuid references members(id),
  role member_type not null default 'staff',
  created_at timestamptz not null default now()
);

-- sessions: 영업 회차
create table sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  status session_status not null default 'prep',
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

-- attendance: 출근부 (공주님/스탭)
create table attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  member_id uuid not null references members(id),
  planned boolean not null default true,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  available_slots int not null default 0,
  unique (session_id, member_id)
);

-- customers: 손님 (phone = 실질 ID)
create table customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  nickname text not null,
  memo text,
  birthday date,
  preferred_princess uuid references members(id),
  referred_by uuid references members(id),
  created_at timestamptz not null default now()
);

-- bans: 블랙리스트
create table bans (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  phone text,
  reason text not null,
  created_by uuid references members(id),
  lifted boolean not null default false,
  created_at timestamptz not null default now()
);

-- reservations: 예약 (분 단위 슬롯)
create table reservations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  customer_id uuid not null references customers(id),
  princess_id uuid not null references members(id),
  start_min int not null,
  end_min int not null,
  status reservation_status not null default 'booked',
  created_by uuid references members(id),
  created_at timestamptz not null default now()
);

create index on attendance (session_id);
create index on reservations (session_id);
create index on reservations (princess_id);
