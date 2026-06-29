export function overlaps(a, b) {
  return a.start < b.end && b.start < a.end
}

export function isAvailable(busy, slot) {
  return !busy.some((b) => overlaps(b, slot))
}

// 현재 타임 끝에서 extendMinutes 만큼 연장 가능한지
export function canExtend(busy, currentSlot, extendMinutes) {
  const extended = { start: currentSlot.end, end: currentSlot.end + extendMinutes }
  // 현재 슬롯 자신은 busy에 있을 수 있으므로 연장 구간만 검사
  return isAvailable(busy, extended)
}

// slot이 공주님 가용 윈도우(window) 안에 완전히 포함되는지
export function withinWindow(window, slot) {
  if (!window) return false
  return slot.start >= window.start && slot.end <= window.end
}
