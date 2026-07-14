-- 제보 시 연관 인물 명단(여러 명, 번호 선택). 정보부가 검토 후 인물 DB에 반영.
create table public.tip_mentions (
  id bigint generated always as identity primary key,
  tip_id bigint not null references public.tips(id) on delete cascade,
  name text,
  phone text,
  applied boolean not null default false,   -- 정보부가 인물 DB 반영 완료 여부
  created_at timestamptz not null default now()
);

alter table public.tip_mentions enable row level security;

create policy tip_mentions_insert on public.tip_mentions for insert
  with check (exists (select 1 from public.tips t where t.id = tip_id and t.submitter_id = auth.uid()));
create policy tip_mentions_select on public.tip_mentions for select
  using (public.is_intel() or exists (select 1 from public.tips t where t.id = tip_id and t.submitter_id = auth.uid()));
create policy tip_mentions_update on public.tip_mentions for update using (public.is_intel());

notify pgrst, 'reload schema';
