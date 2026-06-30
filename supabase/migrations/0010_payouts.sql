-- 정산 지급 상태 (날짜·멤버별)
create table payouts (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  member_id uuid not null references members(id),
  paid boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (date, member_id)
);

alter table payouts enable row level security;
-- 전원 열람
create policy payouts_read on payouts for select using (auth.uid() is not null);
-- 사장만 지급 처리(쓰기)
create policy payouts_owner_write on payouts for all
  using (current_app_role() = 'owner') with check (current_app_role() = 'owner');
