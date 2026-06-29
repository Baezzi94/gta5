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
