-- 역할별 가입 코드
create table if not exists role_codes (
  role member_type primary key,
  code text not null
);

-- 초기 코드 시드 (대문자 8자리 난수)
insert into role_codes(role, code) values
  ('owner',    upper(substr(md5(random()::text), 1, 8))),
  ('staff',    upper(substr(md5(random()::text), 1, 8))),
  ('promoter', upper(substr(md5(random()::text), 1, 8))),
  ('princess', upper(substr(md5(random()::text), 1, 8)))
on conflict (role) do nothing;

alter table role_codes enable row level security;
-- 코드는 사장만 조회/관리 (가입 자동처리는 아래 트리거가 definer로 수행)
create policy role_codes_owner on role_codes for all
  using (current_app_role() = 'owner') with check (current_app_role() = 'owner');

-- 신규 가입 자동 처리: 메타데이터의 코드로 역할 판별 → member + profile 생성
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_code     text := new.raw_user_meta_data->>'code';
  v_name     text := coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email, '@', 1));
  v_phone    text := new.raw_user_meta_data->>'phone';
  v_referrer text := new.raw_user_meta_data->>'referrer';
  v_role     member_type;
  v_member   uuid;
  v_ref      uuid;
begin
  select role into v_role from role_codes where code = v_code;
  if v_role is null then
    return new; -- 코드 불일치: 프로필 미생성(로그인돼도 역할 없음 → 접근 제한)
  end if;

  if v_referrer is not null and length(v_referrer) > 0 then
    select id into v_ref from members
      where phone = v_referrer or name = v_referrer
      limit 1;
  end if;

  insert into members(name, phone, type, referred_by)
    values (v_name, v_phone, v_role, case when v_role = 'princess' then v_ref else null end)
    returning id into v_member;

  insert into profiles(id, member_id, role) values (new.id, v_member, v_role);
  return new;
end$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
