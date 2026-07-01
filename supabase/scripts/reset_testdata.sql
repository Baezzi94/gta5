-- ⚠️ 테스트 데이터 초기화: 사장(시진핑) 계정만 남기고 전부 삭제
-- Supabase SQL Editor에서 1회 실행. (되돌릴 수 없음)

-- 1) 거래/예약/스케줄/출근/정산지급/밴/손님 전부 삭제
--    (payouts·charges는 members를 FK로 물고 있어 members 삭제 전에 반드시 먼저 비워야 함)
delete from payouts;
delete from charges;
delete from reservations;
delete from availability;
delete from attendance;
delete from bans;
delete from customers;
-- 메뉴판(menu_items: 양주/맥주/담배 등)은 카탈로그라 보존

-- 2) 사장 외 로그인 계정 삭제 (profiles는 cascade로 함께 삭제)
delete from auth.users where email <> 'qodiaos@gmail.com';

-- 3) 추천 자기참조 해제 후, 사장 외 멤버 전부 삭제
update members set referred_by = null;
delete from members where type <> 'owner';

-- 확인
select 'members' as t, count(*) from members
union all select 'customers', count(*) from customers
union all select 'reservations', count(*) from reservations
union all select 'charges', count(*) from charges;
