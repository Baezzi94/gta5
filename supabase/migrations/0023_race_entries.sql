-- 음주운전 레이스 참가 신청 (로그인 없이 공개 접수)
-- 신청: 누구나(anon) / 조회·확정·삭제: 시진핑(wholesale_owner)만
-- 전화번호는 공개 뷰에서 제외한다.

create table if not exists race_entries (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  phone text,
  note text,
  confirmed boolean not null default false,   -- 참가 확정 = 참가비 수금 완료
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table race_entries enable row level security;

-- 신청(insert): 로그인 없이 누구나.
-- confirmed 를 직접 true 로 넣지 못하도록 with check 로 차단한다. (중요)
drop policy if exists race_entries_insert_anyone on race_entries;
create policy race_entries_insert_anyone on race_entries for insert
  to anon, authenticated
  with check (
    confirmed = false
    and confirmed_at is null
    and char_length(nickname) between 1 and 30
    and (phone is null or char_length(phone) <= 30)
    and (note is null or char_length(note) <= 200)
  );

-- 조회(select): 시진핑만 (전화번호 포함 원본 접근)
drop policy if exists race_entries_select_head on race_entries;
create policy race_entries_select_head on race_entries for select
  using (exists (select 1 from members m where m.id = current_member_id() and m.wholesale_owner));

-- 참가 확정 토글(update): 시진핑만
drop policy if exists race_entries_update_head on race_entries;
create policy race_entries_update_head on race_entries for update
  using (exists (select 1 from members m where m.id = current_member_id() and m.wholesale_owner));

-- 삭제(스팸 신청 정리): 시진핑만
drop policy if exists race_entries_delete_head on race_entries;
create policy race_entries_delete_head on race_entries for delete
  using (exists (select 1 from members m where m.id = current_member_id() and m.wholesale_owner));

-- 공개 리스트용 뷰: 닉네임/확정여부/신청시각만. 전화번호·메모는 노출하지 않는다.
-- security_invoker = false (기본값) 이므로 뷰 소유자 권한으로 실행되어 base table RLS 를 우회한다. 의도된 동작.
drop view if exists race_entries_public;
create view race_entries_public with (security_invoker = false) as
  select id, nickname, confirmed, created_at
  from race_entries;

grant insert on race_entries to anon, authenticated;
grant select on race_entries_public to anon, authenticated;

notify pgrst, 'reload schema';
