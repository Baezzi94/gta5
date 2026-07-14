export default function IntelRP() {
  const h = { margin: '18px 0 8px', color: '#e8c15a', fontSize: 16 }
  const dim = { color: '#aaa', lineHeight: 1.7 }
  return (
    <div className="container">
      <h2 style={{ letterSpacing: 2 }}>정보부 RP</h2>
      <p style={{ color: '#888', fontStyle: 'italic', margin: '8px 0 4px' }}>
        "우리는 그림자 속에서 움직이는 자들이다."
      </p>

      <h3 style={h}>운영 의도</h3>
      <div className="card" style={dim}>
        <p>정보부는 Black Out의 눈과 귀다. 정보는 총알보다 싸고, 총알보다 깊게 박힌다.</p>
        <p style={{ marginTop: 8 }}>우리의 모든 행동은 명분에서 시작된다 — 교전이든, 외교든, 사업이든.
          그 명분을 만들어내는 것이 정보부의 존재 이유다.</p>
        <p style={{ marginTop: 8 }}>단순 게임을 넘어 서사(Story)를 만든다. 사소한 목격담이 쌓이면 사건이 되고,
          사건이 쌓이면 조직의 역사가 된다. 여러분의 제보 하나하나가 그 역사의 재료다.</p>
      </div>

      <h3 style={h}>이런 롤플레잉이 가능하다</h3>
      <div className="card" style={dim}>
        <p>· <strong>찌라시 제보</strong> — 목격담, 소문, 스쳐 들은 대화, 사진 한 장. 사소해 보여도 전부 정보다.</p>
        <p style={{ marginTop: 6 }}>· <strong>뒷조사 RP</strong> — 특정 인물의 동선, 인간관계, 약점 파악.</p>
        <p style={{ marginTop: 6 }}>· <strong>잠입·친교 RP</strong> — 타 조직 인물과 어울리며 자연스럽게 정보 수집.</p>
        <p style={{ marginTop: 6 }}>· <strong>증거 확보</strong> — 시비·도발 장면은 즉시 녹화. 우리의 명분은 증거로 완성된다. (행동강령 제9장)</p>
        <p style={{ marginTop: 6 }}>· <strong>정보 거래</strong> — 추후 오픈. 정보에는 값이 붙는다.</p>
      </div>

      <h3 style={h}>구성원별 역할</h3>
      <div className="card" style={dim}>
        <p>· <strong>조직원</strong> — [정보 제공] 탭으로 제보한다. 연관 인물의 전화번호까지 확보하면 최상급 제보다.</p>
        <p style={{ marginTop: 6 }}>· <strong>팀장·부장·지부장</strong> — 담당 구역의 이상 동향을 보고하고, 부하들의 제보를 독려한다.</p>
        <p style={{ marginTop: 6 }}>· <strong>정보부원</strong> — 제보의 진위를 가리고, 분류하고, 인물 기록을 관리한다.</p>
        <p style={{ marginTop: 6 }}>· <strong>정보부장</strong> — 보안등급을 확정하고, 보스께 직접 보고한다.</p>
      </div>

      <h3 style={h}>운영 방침</h3>
      <div className="card" style={dim}>
        <p>· 이 시스템은 정보부원 <strong>리아시</strong>의 의견을 반영하며 계속 개발·개선해나간다.</p>
        <p style={{ marginTop: 6 }}>· 건의사항은 [정보 제공] 탭에서 분류를 <strong>내부</strong>로 해서 올려라.</p>
        <p style={{ marginTop: 6 }}>· 제보자의 신원은 정보부 밖으로 절대 나가지 않는다. 안심하고 제보하라.</p>
      </div>

      <p style={{ textAlign: 'right', color: '#e8c15a', marginTop: 20, letterSpacing: 2 }}>— 정보부장 —</p>
      <p style={{ textAlign: 'right', color: '#555', fontSize: 12, marginTop: 4 }}>
        나를 찾으려 하지 마라. 그것이 서로에게 좋다.
      </p>
    </div>
  )
}
