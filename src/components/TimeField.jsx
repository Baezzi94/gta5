// 24시간 단일 필드 시간 입력. 숫자만 치면 자동으로 HH:MM (예: 2130 → 21:30)
export default function TimeField({ value, onChange, placeholder = '예: 2130', style }) {
  function handle(e) {
    const d = e.target.value.replace(/\D/g, '').slice(0, 4)
    let out = d
    if (d.length > 2) out = d.slice(0, 2) + ':' + d.slice(2)
    onChange(out)
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handle}
      placeholder={placeholder}
      maxLength={5}
      style={{ width: 78, textAlign: 'center', fontVariantNumeric: 'tabular-nums', ...style }}
    />
  )
}
