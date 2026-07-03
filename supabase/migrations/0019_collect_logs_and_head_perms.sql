-- ① 수금(charges 수정)을 스탭도 가능하게 (기존 사장 전용 → 사장·스탭)
drop policy if exists charges_update_owner on charges;
create policy charges_update_ops on charges for update
  using (current_app_role() in ('owner','staff'))
  with check (current_app_role() in ('owner','staff'));

-- ② 수금/미수금 처리 로그 (누가·언제)
create table if not exists charge_collect_logs (
  id uuid primary key default gen_random_uuid(),
  charge_id uuid references charges(id) on delete cascade,
  member_id uuid references members(id) default current_member_id(), -- 누른 사람(JWT 기준 자동)
  collected boolean not null,      -- true=수금, false=미수금 처리
  at timestamptz not null default now()
);
create index if not exists cclog_at_idx on charge_collect_logs (at desc);
alter table charge_collect_logs enable row level security;

-- 기록(insert): 사장·스탭
create policy cclog_insert on charge_collect_logs for insert
  with check (current_app_role() in ('owner','staff'));

-- ③ 열람(select): 시진핑(wholesale_owner = head owner)만. 다른 사장도 못 봄.
create policy cclog_select_head on charge_collect_logs for select
  using (exists (select 1 from members m where m.id = current_member_id() and m.wholesale_owner));

-- ④ 지급(payouts) 처리: 시진핑만 (기존 사장 전체 → head owner). 읽기(payouts_read)는 그대로.
drop policy if exists payouts_owner_write on payouts;
create policy payouts_head_write on payouts for all
  using (exists (select 1 from members m where m.id = current_member_id() and m.wholesale_owner))
  with check (exists (select 1 from members m where m.id = current_member_id() and m.wholesale_owner));
