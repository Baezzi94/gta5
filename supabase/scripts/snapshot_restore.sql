-- ♻️ 스냅샷 시점으로 되돌리기 (테스트 중 쌓인 장부 전부 날리고 스냅샷 상태로 복원)
-- snapshot_create.sql을 먼저 1회 실행해 둔 상태여야 함. 여러 번 실행 가능.
-- members·profiles·role_codes·auth.users는 그대로 유지.
-- Supabase SQL Editor에서 실행. (되돌릴 수 없음)

-- 안전장치: 스냅샷이 없으면 중단
do $$ begin
  if to_regclass('public._bak_charges') is null then
    raise exception '스냅샷이 없습니다. 먼저 snapshot_create.sql을 실행하세요.';
  end if;
end $$;

-- 1) 현재 장부 삭제 (자식 → 부모 순서, FK 위반 방지)
delete from charges;
delete from payouts;
delete from reservations;
delete from attendance;
delete from availability;
delete from bans;
delete from customers;
delete from menu_items;
delete from sessions;

-- 2) 스냅샷에서 복원 (부모 → 자식 순서)
insert into sessions      select * from _bak_sessions;
insert into menu_items    select * from _bak_menu_items;
insert into customers     select * from _bak_customers;
insert into reservations  select * from _bak_reservations;
insert into availability  select * from _bak_availability;
insert into attendance    select * from _bak_attendance;
insert into bans          select * from _bak_bans;
insert into charges       select * from _bak_charges;
insert into payouts       select * from _bak_payouts;

-- 확인: 복원 후 행 수(스냅샷과 일치해야 함)
select 'charges' t, count(*) from charges
union all select 'customers', count(*) from customers
union all select 'reservations', count(*) from reservations
union all select 'availability', count(*) from availability
union all select 'payouts', count(*) from payouts;
