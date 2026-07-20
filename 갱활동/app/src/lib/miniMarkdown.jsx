// 경량 마크다운 렌더러 (외부 라이브러리 없음)
// 지원: # ~ ### 헤딩, 표(| |), - 목록, **굵게**, 빈 줄 문단, 구분선(---)
import React from 'react'

function inline(text, keyBase) {
  // **굵게** 처리
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(p)
    if (m) return <strong key={keyBase + '-' + i}>{m[1]}</strong>
    return <React.Fragment key={keyBase + '-' + i}>{p}</React.Fragment>
  })
}

export function MiniMarkdown({ text }) {
  const lines = (text ?? '').split('\n')
  const blocks = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // 표: 헤더 | --- | 본문
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      const cells = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
      const head = cells(line)
      const rows = []
      i += 2
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push(cells(lines[i])); i++
      }
      blocks.push(
        <div key={key++} style={{ overflowX: 'auto', margin: '10px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{head.map((h, hi) => (
              <th key={hi} style={{ textAlign: 'left', padding: '7px 9px', borderBottom: '1px solid #3a3a42', color: '#c3c2b7', whiteSpace: 'nowrap' }}>{inline(h, key + 'h' + hi)}</th>
            ))}</tr></thead>
            <tbody>{rows.map((r, ri) => (
              <tr key={ri}>{r.map((c, ci) => (
                <td key={ci} style={{ padding: '7px 9px', borderBottom: '1px solid #232329', color: '#e8e8ea', verticalAlign: 'top' }}>{inline(c, key + 'r' + ri + 'c' + ci)}</td>
              ))}</tr>
            ))}</tbody>
          </table>
        </div>
      )
      continue
    }

    // 헤딩
    const h = /^(#{1,3})\s+(.*)$/.exec(line)
    if (h) {
      const lv = h[1].length
      const size = lv === 1 ? 20 : lv === 2 ? 17 : 15
      blocks.push(<div key={key++} style={{ fontSize: size, fontWeight: 700, color: '#e8c15a', margin: '16px 0 6px' }}>{inline(h[2], key)}</div>)
      i++; continue
    }

    // 구분선
    if (/^\s*---+\s*$/.test(line)) {
      blocks.push(<hr key={key++} style={{ border: 0, borderTop: '1px solid #2c2c2a', margin: '14px 0' }} />)
      i++; continue
    }

    // 목록 (연속된 - 줄 묶기)
    if (/^\s*[-*]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++
      }
      blocks.push(<ul key={key++} style={{ margin: '6px 0 6px 18px', color: '#d4d4d8', lineHeight: 1.7 }}>
        {items.map((it, ii) => <li key={ii}>{inline(it, key + 'li' + ii)}</li>)}
      </ul>)
      continue
    }

    // 빈 줄
    if (line.trim() === '') { i++; continue }

    // 일반 문단
    blocks.push(<p key={key++} style={{ margin: '6px 0', color: '#d4d4d8', lineHeight: 1.7 }}>{inline(line, key)}</p>)
    i++
  }

  return <>{blocks}</>
}
