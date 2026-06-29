-- 출근부 가용시간(예정) 윈도우: 자정 기준 분(minutes-of-day)
alter table attendance add column if not exists plan_start_min int;
alter table attendance add column if not exists plan_end_min int;

-- 현재 로그인 사용자의 member_id
create or replace function current_member_id() returns uuid
language sql stable security definer set search_path = public as $$
  select member_id from profiles where id = auth.uid()
$$;

-- 공주님이 본인 출근부 행만 수정(가용시간 입력·출근체크) 가능
create policy attendance_princess_self on attendance for update
  using (current_app_role() = 'princess' and member_id = current_member_id())
  with check (current_app_role() = 'princess' and member_id = current_member_id());
