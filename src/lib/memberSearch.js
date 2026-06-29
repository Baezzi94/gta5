// 전화번호에서 숫자만 남김
export function normalizePhone(s) {
  return (s || '').replace(/\D/g, '')
}

// 멤버 목록을 query(전화 또는 닉 부분일치)로 필터. 빈 query면 전체 반환.
export function searchMembers(members, query) {
  const q = (query || '').trim()
  if (!q) return members
  const qDigits = normalizePhone(q)
  const qLower = q.toLowerCase()
  return members.filter((m) => {
    const byName = (m.name || '').toLowerCase().includes(qLower)
    const byPhone = qDigits.length > 0 && normalizePhone(m.phone).includes(qDigits)
    return byName || byPhone
  })
}
