-- 주류·메뉴 판매 담당(웨이터): 누가 팔았는지 기록 → 그 사람에게 수금
alter table charges add column if not exists sold_by uuid references members(id);
create index if not exists charges_sold_by_idx on charges (sold_by);
