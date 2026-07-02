-- 지급 완료 시점의 정산 금액 스냅샷. 이후 거래가 바뀌어 정산액이 달라지면
-- '지급 X만 / 현재 Y만' 차이를 표시해 과·미지급을 감지하기 위함.
alter table payouts add column if not exists paid_amount int;
