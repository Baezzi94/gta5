-- 📸 지금 시점 데이터 스냅샷 (테스트 시작 전에 1회 실행)
-- 거래/정산 장부 관련 테이블만 백업. members·profiles·role_codes·auth.users는 건드리지 않음.
-- 재실행하면 스냅샷이 "지금"으로 갱신됨(기존 백업 덮어씀).
-- Supabase SQL Editor에서 실행.

drop table if exists _bak_charges;
drop table if exists _bak_payouts;
drop table if exists _bak_reservations;
drop table if exists _bak_availability;
drop table if exists _bak_attendance;
drop table if exists _bak_bans;
drop table if exists _bak_customers;
drop table if exists _bak_menu_items;
drop table if exists _bak_sessions;

create table _bak_charges       as select * from charges;
create table _bak_payouts       as select * from payouts;
create table _bak_reservations  as select * from reservations;
create table _bak_availability  as select * from availability;
create table _bak_attendance    as select * from attendance;
create table _bak_bans          as select * from bans;
create table _bak_customers     as select * from customers;
create table _bak_menu_items    as select * from menu_items;
create table _bak_sessions      as select * from sessions;

-- 확인: 스냅샷 행 수
select '_bak_charges' t, count(*) from _bak_charges
union all select '_bak_customers', count(*) from _bak_customers
union all select '_bak_reservations', count(*) from _bak_reservations
union all select '_bak_availability', count(*) from _bak_availability
union all select '_bak_payouts', count(*) from _bak_payouts;
