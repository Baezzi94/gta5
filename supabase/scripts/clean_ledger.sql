-- 🧹 장부 완전 초기화 (테스트 baseline 0 만들기)
-- 멤버·프로필·가입코드·로그인계정·메뉴판(카탈로그)은 유지.
-- 거래/정산/예약/출근/손님/밴/세션은 전부 삭제 → 이후 snapshot_create.sql로 "빈 상태"를 스냅샷.
-- Supabase SQL Editor에서 실행. (되돌릴 수 없음)

delete from charges;
delete from payouts;
delete from reservations;
delete from attendance;
delete from availability;
delete from bans;
delete from customers;
delete from sessions;
-- menu_items(양주/맥주/담배 등 카탈로그)는 유지. 메뉴도 지우려면 아래 주석 해제:
-- delete from menu_items;

-- 확인: 전부 0이어야 함 (members는 유지되므로 표시)
select 'charges' t, count(*) from charges
union all select 'payouts', count(*) from payouts
union all select 'reservations', count(*) from reservations
union all select 'availability', count(*) from availability
union all select 'customers', count(*) from customers
union all select 'members(유지)', count(*) from members;
