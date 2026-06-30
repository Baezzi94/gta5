-- ⚠️ 테스트 오너 제거: 실제 사장(qodiaos@gmail.com 연결 멤버) + 고츄츄(01035185334)만 보존
-- Supabase SQL Editor에서 실행. 되돌릴 수 없음.

-- 보존 멤버 집합 = (qodiaos 계정에 연결된 멤버) ∪ (고츄츄)
-- 1) 보존 외를 가리키는 추천 링크 해제
update members set referred_by = null
where referred_by is not null
  and referred_by not in (
    select p.member_id from profiles p join auth.users u on u.id = p.id where u.email = 'qodiaos@gmail.com'
    union
    select id from members where phone = '01035185334'
  );

-- 2) 보존 외 멤버의 로그인 계정 삭제 (profiles cascade)
delete from auth.users u using profiles p
where p.id = u.id
  and p.member_id not in (
    select p2.member_id from profiles p2 join auth.users u2 on u2.id = p2.id where u2.email = 'qodiaos@gmail.com'
    union
    select id from members where phone = '01035185334'
  );

-- 3) 보존 외 멤버 삭제
delete from members
where id not in (
  select p.member_id from profiles p join auth.users u on u.id = p.id where u.email = 'qodiaos@gmail.com'
  union
  select id from members where phone = '01035185334'
);

-- 확인 (시진핑 + 고츄츄 2명만 나와야 함)
select m.name, m.type, m.phone, u.email
from members m
left join profiles p on p.member_id = m.id
left join auth.users u on u.id = p.id;
