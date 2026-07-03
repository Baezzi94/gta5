-- 중간정산 때 시진핑이 각 사람한테 실제로 받은 돈 기록 (검산용). 시진핑만 접근.
create table if not exists cash_handovers (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id),
  date date not null,          -- 영업일
  amount int not null,         -- 실제 받은 금액
  at timestamptz not null default now(),
  note text
);
create index if not exists handover_date_idx on cash_handovers (date);
alter table cash_handovers enable row level security;

-- 시진핑(wholesale_owner = head owner)만 기록/열람/삭제
create policy handover_head_all on cash_handovers for all
  using (exists (select 1 from members m where m.id = current_member_id() and m.wholesale_owner))
  with check (exists (select 1 from members m where m.id = current_member_id() and m.wholesale_owner));
