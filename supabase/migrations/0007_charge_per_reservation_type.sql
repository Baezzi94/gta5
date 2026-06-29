-- 예약당 TC + 대화료 둘 다 붙도록 유니크를 (예약, 유형) 조합으로 변경
drop index if exists charges_reservation_uidx;
create unique index if not exists charges_reservation_type_uidx
  on charges (reservation_id, type) where reservation_id is not null;
