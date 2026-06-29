-- 예약을 2차(외부 데이트)로 전환했는지 표시 (자리 비움 + 일정 점유)
alter table reservations add column if not exists is_date2 boolean not null default false;
