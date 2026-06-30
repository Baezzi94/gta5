-- ⚠️ 테스트 오너 제거: 실제 사장(qodiaos@gmail.com 연결 멤버) + 고츄츄(01035185334)만 보존
-- Supabase SQL Editor에서 실행. 되돌릴 수 없음. (UNION 미사용 버전)

-- 1) 추천 링크 정리 (보존 대상 아닌 것 가리키면 null)
update members set referred_by = null
where referred_by is not null
  and referred_by not in (select id from members where phone = '01035185334')
  and referred_by not in (select p.member_id from profiles p join auth.users u on u.id = p.id where u.email = 'qodiaos@gmail.com');

-- 2) 보존 외 멤버의 로그인 계정 삭제 (profiles는 cascade)
delete from auth.users
where email <> 'qodiaos@gmail.com'
  and id in (
    select p.id from profiles p
    where p.member_id not in (select id from members where phone = '01035185334')
      and p.member_id not in (select p2.member_id from profiles p2 join auth.users u2 on u2.id = p2.id where u2.email = 'qodiaos@gmail.com')
  );

-- 3) 보존 외 멤버 삭제
delete from members
where phone is distinct from '01035185334'
  and id not in (select p.member_id from profiles p join auth.users u on u.id = p.id where u.email = 'qodiaos@gmail.com');

-- 확인 (시진핑 + 고츄츄 2명만 나와야 함)
select m.name, m.type, m.phone, u.email
from members m
left join profiles p on p.member_id = m.id
left join auth.users u on u.id = p.id;
