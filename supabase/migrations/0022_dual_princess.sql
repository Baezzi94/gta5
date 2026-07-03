-- 겸업: 스탭 등 비(非)공주 멤버가 공주 역할도 겸할 수 있음.
-- true면 예약판·거래추가 공주 선택·찌라시·공주 출근부에 함께 노출되어 대화료/2차를 받을 수 있음.
-- (정산은 이미 princess_id 기준으로 대화료/2차를 지급하므로 별도 로직 변경 없음)
alter table members add column if not exists dual_princess boolean not null default false;
