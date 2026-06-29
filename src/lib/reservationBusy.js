// 예약 목록을 가용성 계산용 busy 구간 [{start,end}]으로 변환.
// 취소(cancelled)·노쇼(no_show)는 자리를 차지하지 않으므로 제외.
export function reservationsToBusy(reservations) {
  return (reservations || [])
    .filter((r) => r.status !== 'cancelled' && r.status !== 'no_show')
    .map((r) => ({ start: r.start_min, end: r.end_min }))
}
