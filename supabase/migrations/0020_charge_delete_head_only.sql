-- 거래(charges) 삭제는 시진핑(wholesale_owner = head owner)만. 다른 사장·스탭 모두 불가.
-- 기존 charges_delete_owner(사장 전체)를 head owner 전용으로 교체.
drop policy if exists charges_delete_owner on charges;
create policy charges_delete_head on charges for delete
  using (exists (select 1 from members m where m.id = current_member_id() and m.wholesale_owner));
