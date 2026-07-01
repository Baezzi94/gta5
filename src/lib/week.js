// 로컬 기준 'YYYY-MM-DD'
export function ymd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 영업일 경계 시각(새벽 6시). 이 이전은 전날 영업일로 귀속.
export const BUSINESS_DAY_START_HOUR = 6

// 영업일 기준 'YYYY-MM-DD' — 자정~새벽6시 사이는 전날로 잡아 야간영업이 하루로 묶이게.
export function businessYmd(d) {
  return ymd(new Date(d.getTime() - BUSINESS_DAY_START_HOUR * 3600 * 1000))
}

export function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

// 그 주의 월요일 00:00
export function startOfWeek(d) {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7 // 월=0 ... 일=6
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x
}

// 시작일(Date)로부터 7일치 'YYYY-MM-DD' 배열
export function weekDates(start) {
  const arr = []
  for (let i = 0; i < 7; i++) arr.push(ymd(addDays(start, i)))
  return arr
}
