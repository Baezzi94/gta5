-- 보고서 update 권한을 보스+정보부장(is_admin)으로 확대.
-- 기존엔 보스만 가능(read_at 처리용)이었으나, 정보부장도 [전체 공유](clearance 변경)를 하려면 필요.
drop policy if exists reports_update_read on public.reports;
create policy reports_update on public.reports for update using (public.is_admin());

notify pgrst, 'reload schema';
