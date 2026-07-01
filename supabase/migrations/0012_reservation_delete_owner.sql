-- 예약 삭제는 사장만. 기존 reservations_ops_write(for all)는 스탭에게도 DELETE를 허용했음(UI만 숨김).
-- select/insert/update는 사장·스탭 유지, delete만 사장으로 분리.
-- 재실행 가능하도록 기존 정책 모두 drop 후 재생성
drop policy if exists reservations_ops_write on reservations;
drop policy if exists reservations_insert_ops on reservations;
drop policy if exists reservations_update_ops on reservations;
drop policy if exists reservations_delete_owner on reservations;

create policy reservations_insert_ops on reservations for insert
  with check (current_app_role() in ('owner','staff'));

create policy reservations_update_ops on reservations for update
  using (current_app_role() in ('owner','staff'))
  with check (current_app_role() in ('owner','staff'));

create policy reservations_delete_owner on reservations for delete
  using (current_app_role() = 'owner');
