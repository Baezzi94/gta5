-- 버그: charges_reservation_uidx가 reservation_id 단독 유니크라
-- 한 예약에 TC + 대화료(+2차)를 동시에 넣을 수 없어 "진행" 시 두 번째 거래가 유니크 위반으로 실패.
-- 의도(주석 "예약당 대화료 중복 생성 방지")대로 (reservation_id, type)로 교체:
--   - 유형별 1건은 허용(TC/대화료/2차 공존)
--   - 같은 유형 중복(동시 진행 클릭 레이스)은 여전히 차단
drop index if exists charges_reservation_uidx;
create unique index charges_reservation_uidx on charges (reservation_id, type) where reservation_id is not null;
