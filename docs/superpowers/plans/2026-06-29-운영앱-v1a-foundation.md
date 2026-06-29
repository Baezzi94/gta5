# 운영앱 V1-A (기반) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CLIMAX 토킹바 운영앱의 기반(프로젝트 스캐폴딩 + Supabase + DB 스키마/RLS + 인증/권한 + 핵심 순수로직)을 구축한다. 완료 시 로그인되고, 역할별 홈이 보이고, DB+보안(RLS)이 준비되고, 권한·익명코드·예약가용성 로직이 단위테스트를 통과한다.

**Architecture:** React+Vite SPA가 Supabase(Postgres+Auth+RLS+Storage)를 직접 호출한다. 권한은 두 겹 — 클라이언트 `can()` 헬퍼(UI 게이팅) + Postgres RLS(실제 보안). 비즈니스 순수로직(권한/익명코드/예약가용성)은 Supabase와 분리된 순수 함수로 만들어 Vitest로 테스트한다.

**Tech Stack:** React 18, Vite 5, Vitest 2, @testing-library/react, react-router-dom 6, @supabase/supabase-js 2.

## Global Constraints

- 모든 금액·활동은 게임 내 화폐(RP)·인게임 RP 기준 (실제 금전·실제 개인정보 아님).
- 역할(role)은 정확히 4종: `owner`, `staff`, `promoter`, `princess`.
- 손님 실질 ID = `phone`(고정, unique). 닉네임은 표시·취합용. 익명코드는 저장하지 않고 phone+날짜로 매일(KST 자정) 파생.
- 정산 분배 규칙(V2에서 사용, 여기선 상수로만 정의): TC 5만 전액 풀, 대화료 풀몫 10만/타임, 2차 풀몫 25만/건, 손님추천 3만/명(풀 차감), 공주영입 1만/타임(풀 차감), 지분 사장 1.2 : 출근 스탭 각 1.0.
- 시크릿(Supabase URL/anon key)은 `.env`로만 주입. `.env`는 커밋 금지(.gitignore에 이미 포함).
- 테스트 우선(TDD). 순수로직은 반드시 실패 테스트 → 구현 → 통과 순서.

---

## File Structure

```
gta5/
├─ package.json                      # 의존성·스크립트
├─ vite.config.js                    # vite + vitest 설정
├─ index.html                        # 앱 진입 HTML
├─ .env.example                      # 환경변수 예시(실제 .env는 미커밋)
├─ src/
│  ├─ main.jsx                       # React 부트스트랩
│  ├─ test/setup.js                  # 테스트 셋업(jest-dom)
│  ├─ lib/
│  │  ├─ supabase.js                 # Supabase 클라이언트 싱글톤
│  │  ├─ permissions.js              # RBAC 매트릭스 + can()
│  │  ├─ permissions.test.js
│  │  ├─ anonCode.js                 # 24h 회전 익명 식별번호 파생
│  │  ├─ anonCode.test.js
│  │  ├─ availability.js             # 예약 가용성/연장 가능 판정
│  │  ├─ availability.test.js
│  │  ├─ routing.js                  # 역할→홈 경로 매핑
│  │  └─ routing.test.js
│  ├─ app/
│  │  ├─ AuthContext.jsx             # 세션·역할 컨텍스트
│  │  ├─ ProtectedRoute.jsx          # 인증 가드
│  │  └─ App.jsx                     # 라우터 + 셸
│  └─ pages/
│     ├─ Login.jsx                   # 로그인 화면
│     └─ Home.jsx                    # 역할별 홈(플레이스홀더)
└─ supabase/
   └─ migrations/
      ├─ 0001_init.sql               # 스키마(테이블/enum)
      └─ 0002_rls.sql                # RLS 정책
```

---

### Task 1: 프로젝트 스캐폴딩 (Vite + Vitest)

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `.env.example`, `src/main.jsx`, `src/test/setup.js`, `src/app/App.jsx`, `src/pages/Home.jsx`

**Interfaces:**
- Produces: 실행 가능한 Vite 앱(`npm run dev`), 동작하는 Vitest(`npm test`). `App` 컴포넌트 export default.

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "gongju-club-ops",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.1",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.1.1",
    "vite": "^5.4.2",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: vite.config.js 작성**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 3: index.html, src/test/setup.js, src/main.jsx, src/app/App.jsx, src/pages/Home.jsx 작성**

`index.html`:
```html
<!DOCTYPE html>
<html lang="ko">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>공주님 클럽 운영앱</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>
</html>
```

`src/test/setup.js`:
```js
import '@testing-library/jest-dom'
```

`src/main.jsx`:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

`src/app/App.jsx` (임시, Task 9에서 교체):
```jsx
import Home from '../pages/Home.jsx'
export default function App() {
  return <Home />
}
```

`src/pages/Home.jsx`:
```jsx
export default function Home() {
  return <h1>공주님 클럽 운영앱</h1>
}
```

- [ ] **Step 4: 의존성 설치 + 테스트 러너 동작 확인**

Run: `npm install`
Then: `npm test`
Expected: Vitest 실행, "no test files found" (아직 테스트 없음) — 에러 없이 종료(exit 0)

- [ ] **Step 5: 개발 서버 기동 확인**

Run: `npm run dev`
Expected: Vite 서버 기동, 브라우저에서 "공주님 클럽 운영앱" 표시. 확인 후 Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add package.json vite.config.js index.html .env.example src/
git commit -m "feat: scaffold vite+react+vitest app"
```

---

### Task 2: Supabase 클라이언트 + 환경변수

**Files:**
- Create: `src/lib/supabase.js`, `.env.example`

**Interfaces:**
- Produces: `supabase` (SupabaseClient 싱글톤). 다른 모듈은 `import { supabase } from '../lib/supabase'`로 사용.

- [ ] **Step 1: .env.example 작성**

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

- [ ] **Step 2: src/lib/supabase.js 작성**

```js
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn('Supabase 환경변수가 비어있습니다. .env를 확인하세요.')
}

export const supabase = createClient(url ?? '', anonKey ?? '')
```

- [ ] **Step 3: import 동작 확인(빌드 체크)**

Run: `npm run build`
Expected: 빌드 성공(타입/구문 에러 없음).

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.js .env.example
git commit -m "feat: add supabase client and env template"
```

---

### Task 3: 권한(RBAC) 모듈 — `can()`

**Files:**
- Create: `src/lib/permissions.js`, `src/lib/permissions.test.js`

**Interfaces:**
- Produces:
  - `PERMISSIONS` (역할별 권한 맵)
  - `can(role: string, module: string, action: string): boolean`

- [ ] **Step 1: 실패 테스트 작성 (`src/lib/permissions.test.js`)**

```js
import { describe, it, expect } from 'vitest'
import { can } from './permissions'

describe('can()', () => {
  it('owner는 모든 모듈/액션 허용', () => {
    expect(can('owner', 'settlements', 'confirm')).toBe(true)
    expect(can('owner', 'members', 'delete')).toBe(true)
  })
  it('staff는 예약 생성·수정 허용, 정산 확정 불가', () => {
    expect(can('staff', 'reservations', 'create')).toBe(true)
    expect(can('staff', 'reservations', 'update')).toBe(true)
    expect(can('staff', 'settlements', 'confirm')).toBe(false)
  })
  it('promoter는 추천 등록만, 예약 불가', () => {
    expect(can('promoter', 'referrals', 'create')).toBe(true)
    expect(can('promoter', 'reservations', 'create')).toBe(false)
  })
  it('princess는 본인 출근 체크만, 손님 관리 불가', () => {
    expect(can('princess', 'attendance', 'checkin_self')).toBe(true)
    expect(can('princess', 'customers', 'create')).toBe(false)
  })
  it('알 수 없는 역할은 모두 거부', () => {
    expect(can('ghost', 'reservations', 'create')).toBe(false)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/permissions.test.js`
Expected: FAIL ("can is not a function" 등)

- [ ] **Step 3: 구현 작성 (`src/lib/permissions.js`)**

```js
// 역할별 권한 맵. owner는 '*' = 전체 허용.
export const PERMISSIONS = {
  owner: '*',
  staff: {
    sessions: ['read'],
    attendance: ['create', 'update', 'assign'],
    customers: ['create', 'read', 'update'],
    bans: ['create', 'read'],
    reservations: ['create', 'update', 'read'],
    transactions: ['create', 'read'],
    referrals: ['create'],
    settlements: ['read'],
    flyer: ['create'],
    notes: ['create'],
  },
  promoter: {
    referrals: ['create', 'read_own'],
    settlements: ['read_own'],
    flyer: ['create'],
  },
  princess: {
    sessions: ['read'],
    attendance: ['checkin_self'],
    reservations: ['read_own'],
    settlements: ['read_own'],
  },
}

export function can(role, module, action) {
  const perms = PERMISSIONS[role]
  if (!perms) return false
  if (perms === '*') return true
  const allowed = perms[module]
  return Array.isArray(allowed) && allowed.includes(action)
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/permissions.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/permissions.js src/lib/permissions.test.js
git commit -m "feat: add RBAC permissions helper with tests"
```

---

### Task 4: 익명 식별번호 (24h 회전) — `dailyAnonCode()`

**Files:**
- Create: `src/lib/anonCode.js`, `src/lib/anonCode.test.js`

**Interfaces:**
- Produces:
  - `toDayKey(date: Date): string` — KST 기준 'YYYY-MM-DD'
  - `dailyAnonCode(phone: string, date: Date): string` — 6자리 숫자 문자열

- [ ] **Step 1: 실패 테스트 작성 (`src/lib/anonCode.test.js`)**

```js
import { describe, it, expect } from 'vitest'
import { dailyAnonCode, toDayKey } from './anonCode'

describe('dailyAnonCode()', () => {
  const d1 = new Date('2026-06-29T10:00:00Z')
  const d1b = new Date('2026-06-29T20:00:00Z') // 같은 KST 날짜
  const d2 = new Date('2026-06-30T10:00:00Z') // 다음 날

  it('항상 6자리 숫자', () => {
    expect(dailyAnonCode('010-1234-5678', d1)).toMatch(/^\d{6}$/)
  })
  it('같은 전화·같은 날이면 동일 코드', () => {
    expect(dailyAnonCode('010-1234-5678', d1)).toBe(dailyAnonCode('010-1234-5678', d1b))
  })
  it('날이 바뀌면 코드가 바뀐다', () => {
    expect(dailyAnonCode('010-1234-5678', d1)).not.toBe(dailyAnonCode('010-1234-5678', d2))
  })
  it('다른 전화면 (같은 날) 보통 다른 코드', () => {
    expect(dailyAnonCode('010-1111-1111', d1)).not.toBe(dailyAnonCode('010-2222-2222', d1))
  })
})

describe('toDayKey()', () => {
  it('KST 기준 날짜로 환산 (UTC 16:00 = KST 익일 01:00)', () => {
    expect(toDayKey(new Date('2026-06-29T16:00:00Z'))).toBe('2026-06-30')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/anonCode.test.js`
Expected: FAIL ("dailyAnonCode is not a function")

- [ ] **Step 3: 구현 작성 (`src/lib/anonCode.js`)**

```js
// KST(UTC+9) 기준 날짜 키 'YYYY-MM-DD'
export function toDayKey(date) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

// phone + KST 날짜 → 결정적 6자리 코드 (FNV-1a 해시)
export function dailyAnonCode(phone, date) {
  const seed = `${phone}|${toDayKey(date)}`
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const code = (h >>> 0) % 1000000
  return String(code).padStart(6, '0')
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/anonCode.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/anonCode.js src/lib/anonCode.test.js
git commit -m "feat: add daily-rotating anonymous code with tests"
```

---

### Task 5: 예약 가용성/연장 판정 — `availability`

**Files:**
- Create: `src/lib/availability.js`, `src/lib/availability.test.js`

**Interfaces:**
- 구간 표현: `{ start: number, end: number }` (세션 오픈 기준 분 단위)
- Produces:
  - `overlaps(a, b): boolean`
  - `isAvailable(busy: Interval[], slot: Interval): boolean`
  - `canExtend(busy: Interval[], currentSlot: Interval, extendMinutes: number): boolean`

- [ ] **Step 1: 실패 테스트 작성 (`src/lib/availability.test.js`)**

```js
import { describe, it, expect } from 'vitest'
import { overlaps, isAvailable, canExtend } from './availability'

describe('overlaps()', () => {
  it('겹치면 true', () => {
    expect(overlaps({ start: 0, end: 20 }, { start: 10, end: 30 })).toBe(true)
  })
  it('맞닿기만 하면(끝=시작) false', () => {
    expect(overlaps({ start: 0, end: 20 }, { start: 20, end: 40 })).toBe(false)
  })
})

describe('isAvailable()', () => {
  const busy = [{ start: 0, end: 20 }, { start: 40, end: 100 }] // 40~100은 2차 블로킹 등
  it('빈 구간이면 가능', () => {
    expect(isAvailable(busy, { start: 20, end: 40 })).toBe(true)
  })
  it('겹치면 불가', () => {
    expect(isAvailable(busy, { start: 30, end: 50 })).toBe(false)
  })
})

describe('canExtend()', () => {
  it('다음 슬롯 비어있으면 연장 가능', () => {
    const busy = [{ start: 0, end: 20 }]
    expect(canExtend(busy, { start: 0, end: 20 }, 20)).toBe(true)
  })
  it('다음 슬롯에 예약 차 있으면 연장 불가', () => {
    const busy = [{ start: 0, end: 20 }, { start: 20, end: 40 }]
    expect(canExtend(busy, { start: 0, end: 20 }, 20)).toBe(false)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/availability.test.js`
Expected: FAIL

- [ ] **Step 3: 구현 작성 (`src/lib/availability.js`)**

```js
export function overlaps(a, b) {
  return a.start < b.end && b.start < a.end
}

export function isAvailable(busy, slot) {
  return !busy.some((b) => overlaps(b, slot))
}

// 현재 타임 끝에서 extendMinutes 만큼 연장 가능한지
export function canExtend(busy, currentSlot, extendMinutes) {
  const extended = { start: currentSlot.end, end: currentSlot.end + extendMinutes }
  // 현재 슬롯 자신은 busy에 있을 수 있으므로 연장 구간만 검사
  return isAvailable(busy, extended)
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/availability.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/availability.js src/lib/availability.test.js
git commit -m "feat: add reservation availability/extension logic with tests"
```

---

### Task 6: DB 스키마 마이그레이션

**Files:**
- Create: `supabase/migrations/0001_init.sql`

**Interfaces:**
- Produces: 테이블 `members, profiles, sessions, attendance, customers, bans, reservations` 및 enum `member_type, session_status, reservation_status`.

- [ ] **Step 1: 스키마 SQL 작성 (`supabase/migrations/0001_init.sql`)**

```sql
-- Enums
create type member_type as enum ('owner','staff','promoter','princess');
create type session_status as enum ('prep','open','closed');
create type reservation_status as enum ('booked','in_progress','done','no_show','cancelled');

-- members: 공주님/스탭/삐끼/사장 프로필
create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  type member_type not null,
  profile_photo_url text,
  referred_by uuid references members(id),
  active boolean not null default true,
  memo text,
  created_at timestamptz not null default now()
);

-- profiles: auth 계정 ↔ member ↔ 역할
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  member_id uuid references members(id),
  role member_type not null default 'staff',
  created_at timestamptz not null default now()
);

-- sessions: 영업 회차
create table sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  status session_status not null default 'prep',
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

-- attendance: 출근부 (공주님/스탭)
create table attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  member_id uuid not null references members(id),
  planned boolean not null default true,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  available_slots int not null default 0,
  unique (session_id, member_id)
);

-- customers: 손님 (phone = 실질 ID)
create table customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  nickname text not null,
  memo text,
  birthday date,
  preferred_princess uuid references members(id),
  referred_by uuid references members(id),
  created_at timestamptz not null default now()
);

-- bans: 블랙리스트
create table bans (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  phone text,
  reason text not null,
  created_by uuid references members(id),
  lifted boolean not null default false,
  created_at timestamptz not null default now()
);

-- reservations: 예약 (분 단위 슬롯)
create table reservations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  customer_id uuid not null references customers(id),
  princess_id uuid not null references members(id),
  start_min int not null,
  end_min int not null,
  status reservation_status not null default 'booked',
  created_by uuid references members(id),
  created_at timestamptz not null default now()
);

create index on attendance (session_id);
create index on reservations (session_id);
create index on reservations (princess_id);
```

- [ ] **Step 2: Supabase 프로젝트에 적용**

Supabase 대시보드 → SQL Editor에 위 SQL을 붙여넣고 실행한다. (또는 Supabase CLI `supabase db push`)
Expected: 에러 없이 7개 테이블 + 3개 enum 생성. Table Editor에서 테이블 확인.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "feat: add database schema migration (v1 tables)"
```

---

### Task 7: RLS 정책

**Files:**
- Create: `supabase/migrations/0002_rls.sql`

**Interfaces:**
- Consumes: Task 6 테이블, `profiles.role`
- Produces: 함수 `current_app_role()` + 각 테이블 RLS 정책. owner=전체, staff=운영, promoter/princess=제한.

- [ ] **Step 1: RLS SQL 작성 (`supabase/migrations/0002_rls.sql`)**

```sql
-- 현재 로그인 사용자의 역할
create or replace function current_app_role() returns member_type
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

-- RLS 활성화
alter table members enable row level security;
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table attendance enable row level security;
alter table customers enable row level security;
alter table bans enable row level security;
alter table reservations enable row level security;

-- profiles: 본인 것 읽기, owner는 전체
create policy profiles_self_read on profiles for select
  using (id = auth.uid() or current_app_role() = 'owner');
create policy profiles_owner_write on profiles for all
  using (current_app_role() = 'owner') with check (current_app_role() = 'owner');

-- members: 로그인하면 읽기 가능, owner만 쓰기
create policy members_read on members for select using (auth.uid() is not null);
create policy members_owner_write on members for all
  using (current_app_role() = 'owner') with check (current_app_role() = 'owner');

-- sessions: 로그인 읽기, owner 쓰기
create policy sessions_read on sessions for select using (auth.uid() is not null);
create policy sessions_owner_write on sessions for all
  using (current_app_role() = 'owner') with check (current_app_role() = 'owner');

-- attendance: 로그인 읽기 / owner·staff 쓰기
create policy attendance_read on attendance for select using (auth.uid() is not null);
create policy attendance_ops_write on attendance for all
  using (current_app_role() in ('owner','staff'))
  with check (current_app_role() in ('owner','staff'));

-- customers: 로그인 읽기 / owner·staff 쓰기
create policy customers_read on customers for select using (auth.uid() is not null);
create policy customers_ops_write on customers for all
  using (current_app_role() in ('owner','staff'))
  with check (current_app_role() in ('owner','staff'));

-- bans: 로그인 읽기 / owner·staff 쓰기
create policy bans_read on bans for select using (auth.uid() is not null);
create policy bans_ops_write on bans for all
  using (current_app_role() in ('owner','staff'))
  with check (current_app_role() in ('owner','staff'));

-- reservations: 로그인 읽기 / owner·staff 쓰기
create policy reservations_read on reservations for select using (auth.uid() is not null);
create policy reservations_ops_write on reservations for all
  using (current_app_role() in ('owner','staff'))
  with check (current_app_role() in ('owner','staff'));
```

- [ ] **Step 2: Supabase에 적용 + 검증**

SQL Editor에서 실행. 이후 검증:
1. 테스트용 auth 사용자 2명 생성(대시보드 Authentication → Add user): owner용/staff용.
2. 각 사용자에 대응하는 `profiles` 행 삽입(`role` 지정).
3. SQL Editor에서 `set role authenticated; select current_app_role();` 대신, 실제 검증은 Task 8 로그인 후 앱에서 수행.
Expected: 정책 생성 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0002_rls.sql
git commit -m "feat: add RLS policies for v1 tables"
```

---

### Task 8: 인증 컨텍스트 + 로그인 화면

**Files:**
- Create: `src/app/AuthContext.jsx`, `src/pages/Login.jsx`
- Modify: `src/main.jsx` (AuthProvider로 감싸기)

**Interfaces:**
- Consumes: `supabase` (Task 2)
- Produces:
  - `AuthProvider` (컴포넌트)
  - `useAuth(): { session, role, memberId, loading, signIn(email,password), signOut() }`

- [ ] **Step 1: AuthContext 작성 (`src/app/AuthContext.jsx`)**

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [memberId, setMemberId] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    if (!userId) { setRole(null); setMemberId(null); return }
    const { data } = await supabase.from('profiles').select('role, member_id').eq('id', userId).single()
    setRole(data?.role ?? null)
    setMemberId(data?.member_id ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session?.user?.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s)
      await loadProfile(s?.user?.id)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = {
    session, role, memberId, loading,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Login 화면 작성 (`src/pages/Login.jsx`)**

```jsx
import { useState } from 'react'
import { useAuth } from '../app/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 320, margin: '80px auto', display: 'grid', gap: 12 }}>
      <h1>공주님 클럽 운영앱</h1>
      <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">로그인</button>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </form>
  )
}
```

- [ ] **Step 3: main.jsx에서 AuthProvider 적용**

`src/main.jsx`를 아래로 교체:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.jsx'
import { AuthProvider } from './app/AuthContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
```

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 5: Commit**

```bash
git add src/app/AuthContext.jsx src/pages/Login.jsx src/main.jsx
git commit -m "feat: add auth context and login page"
```

---

### Task 9: 역할 기반 라우팅 + 셸

**Files:**
- Create: `src/lib/routing.js`, `src/lib/routing.test.js`, `src/app/ProtectedRoute.jsx`
- Modify: `src/app/App.jsx`, `src/pages/Home.jsx`

**Interfaces:**
- Consumes: `useAuth` (Task 8)
- Produces:
  - `homePathForRole(role): string`
  - `App` 라우터(`/login`, `/`), 미인증 시 `/login`으로 가드.

- [ ] **Step 1: 라우팅 헬퍼 실패 테스트 (`src/lib/routing.test.js`)**

```js
import { describe, it, expect } from 'vitest'
import { homePathForRole } from './routing'

describe('homePathForRole()', () => {
  it('역할별 홈 경로', () => {
    expect(homePathForRole('owner')).toBe('/owner')
    expect(homePathForRole('staff')).toBe('/staff')
    expect(homePathForRole('promoter')).toBe('/promoter')
    expect(homePathForRole('princess')).toBe('/princess')
  })
  it('알 수 없는 역할은 /login', () => {
    expect(homePathForRole(null)).toBe('/login')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/routing.test.js`
Expected: FAIL

- [ ] **Step 3: 구현 (`src/lib/routing.js`)**

```js
export function homePathForRole(role) {
  const map = { owner: '/owner', staff: '/staff', promoter: '/promoter', princess: '/princess' }
  return map[role] ?? '/login'
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/routing.test.js`
Expected: PASS

- [ ] **Step 5: ProtectedRoute 작성 (`src/app/ProtectedRoute.jsx`)**

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <p style={{ padding: 24 }}>로딩 중…</p>
  if (!session) return <Navigate to="/login" replace />
  return children
}
```

- [ ] **Step 6: Home.jsx 역할별 표시로 교체**

```jsx
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
```

- [ ] **Step 7: App.jsx 라우터로 교체**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Login from '../pages/Login'
import Home from '../pages/Home'

function Root() {
  const { session, loading } = useAuth()
  if (loading) return <p style={{ padding: 24 }}>로딩 중…</p>
  return session ? <Navigate to="/" replace /> : <Login />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Root />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 8: 전체 테스트 + 빌드 확인**

Run: `npm test`
Expected: 모든 테스트 PASS (permissions, anonCode, availability, routing)
Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 9: 수동 E2E 확인**

`.env`에 실제 Supabase URL/key 입력 후 `npm run dev`. owner 계정으로 로그인 → "역할: 사장" 표시 → 로그아웃 동작 확인.

- [ ] **Step 10: Commit + 태그**

```bash
git add src/lib/routing.js src/lib/routing.test.js src/app/ProtectedRoute.jsx src/app/App.jsx src/pages/Home.jsx
git commit -m "feat: role-based routing and app shell"
git tag -a v0.2.0 -m "운영앱 V1-A 기반 완성"
```

---

## Self-Review

**Spec coverage (V1-A 범위):**
- 기술스택(Supabase+React+Vite) → Task 1,2,6,7 ✓
- RBAC 권한 매트릭스 → Task 3(클라) + Task 7(RLS) ✓
- 손님 phone=ID/익명 식별번호 24h 회전 → Task 4 + Task 6(customers) ✓
- 예약 가용성/연장(다음 슬롯 차면 불가)·2차 블로킹 표현 → Task 5 ✓
- 데이터 모델(members.referred_by, profile_photo_url, attendance.available_slots, sessions, bans, reservations) → Task 6 ✓
- 인증/역할 홈 → Task 8,9 ✓
- (V1-B에서 다룰 것: 각 모듈 CRUD UI·추천인 phone/닉 검색·찌라시·출근체크 화면. V2: 거래·정산엔진. 본 플랜 범위 밖 — 별도 플랜)

**Placeholder scan:** 모든 코드 스텝에 실제 코드 포함. TBD/TODO 없음. ✓

**Type consistency:** `can(role,module,action)`, `dailyAnonCode(phone,date)`, `toDayKey(date)`, `overlaps/isAvailable/canExtend`, `homePathForRole(role)`, `useAuth()` 반환 필드(session/role/memberId/loading/signIn/signOut) — 태스크 간 일치 확인. ✓

---

## 다음 플랜 (예고)

- **V1-B**: 멤버/세션/출근부/손님/밴/예약 CRUD 화면 + 추천인 phone·닉 검색 + 출근 체크/가용 슬롯 입력 + 예약판 UI
- **V2**: 거래 입력(TC 동선·타임 시작/종료·2차) + 정산 엔진(운영풀·지분·추천 자동분배) + 지급표 + 프로필 사진/찌라시 생성기
- **V3**: 대시보드·매출통계·삐끼 실적·공주님 본인 뷰·백업
