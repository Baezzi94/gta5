-- 현재 로그인 사용자의 역할
create or replace function current_app_role() returns member_type
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

-- RLS 활성화
alter table members enable row level security;
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table attendance enable row level security;
alter table customers enable row level security;
alter table bans enable row level security;
alter table reservations enable row level security;

-- profiles: 본인 것 읽기, owner는 전체
create policy profiles_self_read on profiles for select
  using (id = auth.uid() or current_app_role() = 'owner');
create policy profiles_owner_write on profiles for all
  using (current_app_role() = 'owner') with check (current_app_role() = 'owner');

-- members: 로그인하면 읽기 가능, owner만 쓰기
create policy members_read on members for select using (auth.uid() is not null);
create policy members_owner_write on members for all
  using (current_app_role() = 'owner') with check (current_app_role() = 'owner');

-- sessions: 로그인 읽기, owner 쓰기
create policy sessions_read on sessions for select using (auth.uid() is not null);
create policy sessions_owner_write on sessions for all
  using (current_app_role() = 'owner') with check (current_app_role() = 'owner');

-- attendance: 로그인 읽기 / owner·staff 쓰기
create policy attendance_read on attendance for select using (auth.uid() is not null);
create policy attendance_ops_write on attendance for all
  using (current_app_role() in ('owner','staff'))
  with check (current_app_role() in ('owner','staff'));

-- customers: 로그인 읽기 / owner·staff 쓰기
create policy customers_read on customers for select using (auth.uid() is not null);
create policy customers_ops_write on customers for all
  using (current_app_role() in ('owner','staff'))
  with check (current_app_role() in ('owner','staff'));

-- bans: 로그인 읽기 / owner·staff 쓰기
create policy bans_read on bans for select using (auth.uid() is not null);
create policy bans_ops_write on bans for all
  using (current_app_role() in ('owner','staff'))
  with check (current_app_role() in ('owner','staff'));

-- reservations: 로그인 읽기 / owner·staff 쓰기
create policy reservations_read on reservations for select using (auth.uid() is not null);
create policy reservations_ops_write on reservations for all
  using (current_app_role() in ('owner','staff'))
  with check (current_app_role() in ('owner','staff'));
