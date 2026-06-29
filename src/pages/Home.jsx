import { useAuth } from '../app/AuthContext'

const LABEL = { owner: '사장', staff: '운영스탭', promoter: '삐끼', princess: '공주님' }

export default function Home() {
  const { role, signOut } = useAuth()
  return (
    <div style={{ padding: 24 }}>
      <h1>공주님 클럽 운영앱</h1>
      <p>역할: {LABEL[role] ?? '미지정'}</p>
      <button onClick={signOut}>로그아웃</button>
    </div>
  )
}
