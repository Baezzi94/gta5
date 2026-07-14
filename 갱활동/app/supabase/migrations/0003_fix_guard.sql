-- 가드 트리거 수정: auth.uid()가 null인 컨텍스트(대시보드 Table Editor, 서버)는 허용.
-- 클라이언트(anon key) 요청은 항상 auth.uid()가 있으므로 기존 보호는 유지된다.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.status := old.status;
  end if;
  return new;
end $$;

-- 첫 관리자 지정 (profiles에 행이 본인 1개뿐인 시점에 실행)
update public.profiles set status = 'active', role = 'intel_chief';
