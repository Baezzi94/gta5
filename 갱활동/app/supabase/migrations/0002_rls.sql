-- RLS: 열람 통제는 전부 DB단에서 강제한다.

-- 헬퍼: 내 최소 열람 등급 (낮을수록 기밀 접근 가능. 비활성=99)
create or replace function public.my_min_clearance()
returns int language sql stable security definer set search_path = public as $$
  select case
    when p.status is distinct from 'active' then 99
    when p.role in ('boss','intel_chief') then 0
    when p.role = 'vice' then 1
    when p.role in ('branch_head','manager','intel_agent') then 2
    when p.role in ('team_lead','member') then 3
    else 99 end
  from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.is_intel()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active'
      and p.role in ('boss','intel_chief','intel_agent'))
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active'
      and p.role in ('boss','intel_chief'))
$$;

create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active')
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.persons enable row level security;
alter table public.person_names enable row level security;
alter table public.tips enable row level security;
alter table public.tip_photos enable row level security;
alter table public.tip_persons enable row level security;

-- profiles: 본인 조회/수정(온보딩), 관리자는 전체 조회+수정
create policy profiles_select_own on public.profiles for select using (id = auth.uid());
create policy profiles_select_admin on public.profiles for select using (public.is_admin());
create policy profiles_update_own on public.profiles for update using (id = auth.uid());
create policy profiles_update_admin on public.profiles for update using (public.is_admin());

-- 본인 수정 시 role/status 변경 차단 (관리자만 가능)
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.status := old.status;
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- categories: active 전원 조회, 정보부만 추가
create policy categories_select on public.categories for select using (public.is_active_member());
create policy categories_insert on public.categories for insert with check (public.is_intel());

-- tips: 작성=active 본인 명의, 조회=정보부 전체 or 본인 것, 수정=정보부
create policy tips_insert on public.tips for insert
  with check (public.is_active_member() and submitter_id = auth.uid());
create policy tips_select_intel on public.tips for select using (public.is_intel());
create policy tips_select_own on public.tips for select using (submitter_id = auth.uid());
create policy tips_update_intel on public.tips for update using (public.is_intel());

-- tip_photos: 업로드=본인 제보에만, 조회=정보부 or 본인 제보
create policy tip_photos_insert on public.tip_photos for insert
  with check (exists (select 1 from public.tips t where t.id = tip_id and t.submitter_id = auth.uid()));
create policy tip_photos_select on public.tip_photos for select
  using (public.is_intel() or exists (select 1 from public.tips t where t.id = tip_id and t.submitter_id = auth.uid()));

-- persons / person_names / tip_persons: 정보부 전권, 일반은 등급 통과분 조회
create policy persons_select on public.persons for select
  using (public.is_intel() or (public.is_active_member() and clearance >= public.my_min_clearance()));
create policy persons_write on public.persons for all using (public.is_intel()) with check (public.is_intel());
create policy person_names_select on public.person_names for select
  using (exists (select 1 from public.persons pe where pe.id = person_id
         and (public.is_intel() or (public.is_active_member() and pe.clearance >= public.my_min_clearance()))));
create policy person_names_write on public.person_names for all using (public.is_intel()) with check (public.is_intel());
create policy tip_persons_select on public.tip_persons for select using (public.is_intel());
create policy tip_persons_write on public.tip_persons for all using (public.is_intel()) with check (public.is_intel());

-- 열람용 뷰: 채택된 제보를 등급 필터로, 제보자/내부메모 컬럼 제외하고 노출
-- (뷰 소유자 권한으로 RLS 우회하되 where절로 통제 — 컬럼 은닉 목적)
create or replace view public.browse_tips
with (security_invoker = off) as
  select t.id, t.title, t.body, t.category_id, t.clearance, t.decided_at, t.created_at
  from public.tips t
  where t.status = 'adopted' and t.clearance is not null
    and t.clearance >= public.my_min_clearance();
grant select on public.browse_tips to authenticated;

create or replace view public.browse_tip_photos
with (security_invoker = off) as
  select p.id, p.tip_id, p.path from public.tip_photos p
  where exists (select 1 from public.browse_tips b where b.id = p.tip_id);
grant select on public.browse_tip_photos to authenticated;

-- Storage: tip-photos 버킷 (경로: {uid}/{tip_id}/{filename})
create policy tip_photos_upload on storage.objects for insert
  with check (bucket_id = 'tip-photos' and public.is_active_member()
    and (storage.foldername(name))[1] = auth.uid()::text);
create policy tip_photos_read on storage.objects for select
  using (bucket_id = 'tip-photos' and (
    public.is_intel()
    or (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.tip_photos tp
         join public.browse_tips b on b.id = tp.tip_id
         where tp.path = name)
  ));
