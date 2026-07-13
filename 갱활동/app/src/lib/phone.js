export function normalizePhone(input) {
  return String(input ?? '').replace(/\D/g, '')
}

export function isValidPhone(input) {
  const d = normalizePhone(input)
  return d.length >= 3 && d.length <= 15
}
