-- 공주님 가용 스케줄 (날짜별 시간 블록, 1주일치 미리 등록)
create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id),
  date date not null,
  start_min int not null,
  end_min int not null,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists availability_date_idx on availability (date);
create index if not exists availability_member_idx on availability (member_id);

alter table availability enable row level security;

create policy availability_read on availability for select using (auth.uid() is not null);
create policy availability_ops on availability for all
  using (current_app_role() in ('owner','staff'))
  with check (current_app_role() in ('owner','staff'));
create policy availability_princess_own on availability for all
  using (current_app_role() = 'princess' and member_id = current_member_id())
  with check (current_app_role() = 'princess' and member_id = current_member_id());

-- 예약을 날짜 기반으로 (세션 비강제)
alter table reservations add column if not exists date date;
alter table reservations alter column session_id drop not null;
