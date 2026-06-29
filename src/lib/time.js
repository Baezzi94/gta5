// 'HH:MM' → 자정 기준 분(0~1439). 잘못된 입력은 NaN.
export function hmToMin(hm) {
  if (typeof hm !== 'string') return NaN
  const m = hm.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return NaN
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return NaN
  return h * 60 + min
}

// 분(0~1439) → 'HH:MM'
export function minToHm(min) {
  const h = String(Math.floor(min / 60)).padStart(2, '0')
  const m = String(min % 60).padStart(2, '0')
  return `${h}:${m}`
}
