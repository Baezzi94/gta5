import { describe, it, expect } from 'vitest'
import { toCsv } from './csv'

describe('toCsv() — 내보내기 이스케이프/BOM', () => {
  const rows = [
    { name: '가', amt: 5, note: 'a,b' },
    { name: '나"다', amt: 0, note: null },
  ]
  const cols = [
    { label: '이름', value: 'name' },
    { label: '금액', value: (r) => r.amt * 10000 },
    { label: '메모', value: 'note' },
  ]
  const csv = toCsv(rows, cols)
  const lines = csv.replace(/^﻿/, '').split('\n')

  it('엑셀 한글용 BOM으로 시작', () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })
  it('헤더 + 함수/키 값', () => {
    expect(lines[0]).toBe('이름,금액,메모')
    expect(lines[1]).toBe('가,50000,"a,b"') // 콤마 포함 필드는 따옴표로 감쌈
  })
  it('따옴표는 두 배로 이스케이프, null은 빈칸', () => {
    expect(lines[2]).toBe('"나""다",0,')
  })
  it('빈 rows는 헤더만', () => {
    expect(toCsv([], cols).replace(/^﻿/, '')).toBe('이름,금액,메모\n')
  })
  it('줄바꿈 포함 값도 따옴표 처리', () => {
    const c = toCsv([{ x: '한\n줄' }], [{ label: 'x', value: 'x' }]).replace(/^﻿/, '')
    expect(c).toBe('x\n"한\n줄"')
  })
})
