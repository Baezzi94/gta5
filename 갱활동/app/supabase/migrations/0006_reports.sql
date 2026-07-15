-- 보고서: 정보부장 발신, 보안등급 기반 수신(기본 P0=보스·정보부장). 관련 정보 첨부.
create table public.reports (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null,
  clearance int not null default 0 check (clearance between 0 and 3),
  created_at timestamptz not null default now(),
  read_at timestamptz          -- 보스가 열람한 시각 (null = 미확인)
);

create table public.report_tips (
  report_id bigint not null references public.reports(id) on delete cascade,
  tip_id bigint not null references public.tips(id) on delete cascade,
  primary key (report_id, tip_id)
);

create or replace function public.is_chief()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active' and p.role = 'intel_chief')
$$;

create or replace function public.is_boss()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active' and p.role = 'boss')
$$;

alter table public.reports enable row level security;
alter table public.report_tips enable row level security;

-- 열람: 발신자(정보부장) + 등급 통과자. 발신: 정보부장만. 읽음 처리: 보스만.
create policy reports_select on public.reports for select
  using (public.is_chief() or (public.is_active_member() and clearance >= public.my_min_clearance()));
create policy reports_insert on public.reports for insert with check (public.is_chief());
create policy reports_update_read on public.reports for update using (public.is_boss());

-- 첨부 목록: 상위 보고서가 보이는 사람에게만 (reports RLS가 서브쿼리에 적용됨)
create policy report_tips_select on public.report_tips for select
  using (exists (select 1 from public.reports r where r.id = report_id));
create policy report_tips_insert on public.report_tips for insert with check (public.is_chief());

notify pgrst, 'reload schema';
