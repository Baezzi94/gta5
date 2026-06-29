import { useAuth } from '../app/AuthContext'

const LABEL = { owner: '사장', staff: '운영스탭', promoter: '삐끼', princess: '공주님' }

export default function Home() {
  const { role } = useAuth()
  return (
    <div>
      <h1>공주님 클럽 운영앱</h1>
      <p>환영합니다. 현재 역할: <b>{LABEL[role] ?? '미지정'}</b></p>
      <p style={{ color: '#9a93b8' }}>좌측 메뉴에서 작업을 선택하세요.</p>
    </div>
  )
}
