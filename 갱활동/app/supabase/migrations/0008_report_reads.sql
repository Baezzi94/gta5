-- 보고서 개인별 열람 기록 (누가 읽었는지 추적)
create table public.report_reads (
  report_id bigint not null references public.reports(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

alter table public.report_reads enable row level security;

-- 본인 열람 기록만 남길 수 있음 (해당 보고서가 안 보이면 애초에 상세를 못 여니 자연 차단)
create policy report_reads_insert on public.report_reads for insert
  with check (user_id = auth.uid());
-- 조회: 본인 것 + 관리자(보스·정보부장)는 전원 열람자 명단 확인
create policy report_reads_select_own on public.report_reads for select using (user_id = auth.uid());
create policy report_reads_select_admin on public.report_reads for select using (public.is_admin());

notify pgrst, 'reload schema';
