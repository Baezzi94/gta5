// 로컬 기준 'YYYY-MM-DD'
export function ymd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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
