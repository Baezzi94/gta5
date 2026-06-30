-- 출근부(availability) 권한 강화: 사장만 전체 관리, 그 외(공주/스탭)는 본인 것만
drop policy if exists availability_ops on availability;
drop policy if exists availability_princess_own on availability;

-- 사장: 전체 관리
create policy availability_owner_all on availability for all
  using (current_app_role() = 'owner')
  with check (current_app_role() = 'owner');

-- 본인 것만: 누구든 자기 member_id 행만 추가/수정/삭제
create policy availability_self_all on availability for all
  using (member_id = current_member_id())
  with check (member_id = current_member_id());

-- (읽기 availability_read 정책은 그대로 유지: 로그인하면 전원 열람)
