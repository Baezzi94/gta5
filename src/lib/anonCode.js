// KST(UTC+9) 기준 날짜 키 'YYYY-MM-DD'
export function toDayKey(date) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

// phone + KST 날짜 → 결정적 6자리 코드 (FNV-1a 해시)
export function dailyAnonCode(phone, date) {
  const seed = `${phone}|${toDayKey(date)}`
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const code = (h >>> 0) % 1000000
  return String(code).padStart(6, '0')
}
