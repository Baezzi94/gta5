function esc(v) {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

// rows: 객체 배열, columns: [{ label, value }] (value는 키 문자열 또는 (row)=>값)
export function toCsv(rows, columns) {
  const header = columns.map((c) => esc(c.label)).join(',')
  const body = (rows || [])
    .map((r) => columns.map((c) => esc(typeof c.value === 'function' ? c.value(r) : r[c.value])).join(','))
    .join('\n')
  return '﻿' + header + '\n' + body // BOM: 엑셀 한글 깨짐 방지
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
