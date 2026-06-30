// 'HH:MM' → 자정 기준 분(0~1439). 잘못된 입력은 NaN.
export function hmToMin(hm) {
  if (typeof hm !== 'string') return NaN
  const m = hm.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return NaN
  const h = Number(m[1])
  const min = Number(m[2])
  // 심야 영업 지원: 24:00~29:59 = 자정 넘어 새벽까지 (24:00=1440, 26:00=새벽2시)
  if (h > 29 || min > 59) return NaN
  return h * 60 + min
}

// 분(0~1439) → 'HH:MM'
export function minToHm(min) {
  const h = String(Math.floor(min / 60)).padStart(2, '0')
  const m = String(min % 60).padStart(2, '0')
  return `${h}:${m}`
}
