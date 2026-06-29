-- 거래(수금 대상). TC/대화료/2차
create type charge_type as enum ('tc', 'talk', 'date2');

create table charges (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type charge_type not null,
  amount int not null,                       -- 원 단위 (예: 50000 = 5만)
  customer_id uuid references customers(id),
  princess_id uuid references members(id),
  reservation_id uuid references reservations(id),
  collected boolean not null default false,  -- 수금 완료 여부
  collected_at timestamptz,
  created_at timestamptz not null default now()
);
create index charges_date_idx on charges (date);
-- 예약당 대화료 중복 생성 방지
create unique index charges_reservation_uidx on charges (reservation_id) where reservation_id is not null;

alter table charges enable row level security;

-- 수금현황/정산은 전원 공개(read)
create policy charges_read on charges for select using (auth.uid() is not null);
-- 거래 생성: 사장·스탭 (예약 완료 자동 + 수동)
create policy charges_insert on charges for insert with check (current_app_role() in ('owner','staff'));
-- 수금 처리(수정)·삭제: 사장만
create policy charges_update_owner on charges for update using (current_app_role() = 'owner') with check (current_app_role() = 'owner');
create policy charges_delete_owner on charges for delete using (current_app_role() = 'owner');
