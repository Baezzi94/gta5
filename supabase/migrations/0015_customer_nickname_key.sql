-- 사업 전환: 손님 식별을 닉네임 우선으로.
-- 워크인 술손님은 전화 없이 닉네임(+데일리번호)만으로 등록 가능해야 함.
-- phone: NOT NULL 해제(unique는 유지 — Postgres는 NULL 다중 허용). daily_no 추가.
alter table customers alter column phone drop not null;
alter table customers add column if not exists daily_no text;
