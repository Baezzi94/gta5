-- ⚠️ 시진핑(사장) + 고츄츄(01035185334)만 남기고 전부 삭제 (1회용)
-- Supabase SQL Editor에서 실행. 되돌릴 수 없음.

-- 1) 거래/예약/스케줄/출근/밴/손님 전부 삭제 (깨끗이)
delete from charges;
delete from reservations;
delete from availability;
delete from attendance;
delete from bans;
delete from customers;

-- 2) 시진핑(사장) 전화번호 기록
update members set phone = '01044993016' where type = 'owner';

-- 3) 남길 멤버 = 사장(시진핑) + 고츄츄. 그 외를 참조하는 추천 링크 해제
update members set referred_by = null
  where referred_by not in (select id from members where type = 'owner' or phone = '01035185334');

-- 4) 삭제될 멤버의 로그인 계정 삭제 (profiles는 cascade)
delete from auth.users u using profiles p
  where p.id = u.id
    and p.member_id not in (select id from members where type = 'owner' or phone = '01035185334');

-- 5) 남길 멤버 외 전부 삭제
delete from members where not (type = 'owner' or phone = '01035185334');

-- 확인
select name, type, phone from members;
