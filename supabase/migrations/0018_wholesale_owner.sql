-- 도매(재고)를 대는 사장 지정. 이 사람에게만 주류 도매원가가 회수됨(출근 무관).
-- 사장이 여러 명이어도 도매 담당은 보통 시진핑 1명.
alter table members add column if not exists wholesale_owner boolean not null default false;

-- 앱 owner 계정(시진핑, qodiaos@gmail.com)에 연결된 멤버를 도매 담당으로 지정
update members set wholesale_owner = true
where id = (
  select p.member_id
  from profiles p
  join auth.users u on u.id = p.id
  where u.email = 'qodiaos@gmail.com'
  limit 1
);

-- 담당을 바꾸려면: update members set wholesale_owner=false; update members set wholesale_owner=true where name='시진핑';
