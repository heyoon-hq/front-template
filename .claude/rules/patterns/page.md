---
paths:
  - "app/**"
---

# Page 패턴

Next.js App Router의 페이지 파일(`page.tsx`) 작성 규칙입니다.

## 필수 패턴

### 1. Metadata Export
- **형식**: `export const metadata: Metadata`
- **내용**: `title`, `description` 필수
- **목적**: SEO 최적화

### 2. Import 문
- **Metadata 타입**: `import type { Metadata } from "next"`
- **Server Actions**: `import { actionName } from "@/server/actions/{feature}"`

### 3. Server Component
- **형식**: `export default async function PageName()`
- **데이터 페칭**: `await` 사용 가능
- **병렬 페칭**: `Promise.all` 활용

### 4. 스타일 규칙
- **페이지 타이틀**: `text-2xl font-bold tracking-tight`
- **컨테이너**: `w-full max-w-2xl space-y-6`
- **전체 래퍼**: `flex min-h-screen items-start justify-center px-4 py-8`

---

## 페이지의 관심사

페이지 컴포넌트는 **조립(Composition)**만 담당합니다.

### ✅ 페이지가 하는 일

1. **데이터 페칭**
   - Server Actions 호출 (`await getData()`)
   - 비즈니스 로직 없이 데이터만 가져옴
   - 병렬 페칭 시 `Promise.all` 사용

2. **레이아웃 구조**
   - 전체 페이지 래퍼 (flex container)
   - 타이틀 (`<h1>`)
   - 섹션 구분 (Card 래핑)

3. **컴포넌트 조립**
   - 하위 컴포넌트를 배치하고 조합
   - `initialData` props로 데이터 전달
   - 컴포넌트 내부 구현은 관여하지 않음

### ❌ 페이지가 하지 말아야 할 일

- **비즈니스 로직**: 필터링, 정렬, 계산, 변환 등
- **상태 관리**: `useState`, `useReducer`, Context 등
- **이벤트 핸들러**: `onClick`, `onSubmit` 등 정의
- **UI 세부 구현**: Input, Button, Form 등 직접 작성

### 원칙: "한눈에 파악 가능한 구조"

페이지 코드를 보면:
- ✅ 어떤 컴포넌트들로 구성되어 있는지 즉시 파악 가능
- ✅ 각 컴포넌트가 어떤 데이터를 받는지 명확
- ❌ 하위 컴포넌트 내부 구조는 보이지 않음 (= 의도적)

**예시**: `<TodoForm />`, `<TodoFilteredList />` 만 보고도 "할일 폼과 필터링 가능한 목록이 있구나"를 즉시 이해

---

## 코드 예시

### 기본 페이지
```tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "페이지 제목 | My App",
  description: "페이지 설명",
}

export default async function FeaturePage() {
  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">페이지 제목</h1>
        </div>

        {/* 페이지 콘텐츠 */}
      </div>
    </div>
  )
}
```

### 데이터 페칭이 있는 페이지
```tsx
import type { Metadata } from "next"
import { getData } from "@/server/actions/feature"
import { FeatureList } from "@/components/feature/feature-list"

export const metadata: Metadata = {
  title: "기능 목록 | My App",
  description: "기능을 관리하세요",
}

export default async function FeaturePage() {
  const data = await getData()

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">기능 목록</h1>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <FeatureList initialData={data} />
        </div>
      </div>
    </div>
  )
}
```

---

## 주의사항

### ❌ 하지 말 것
- Metadata export 누락 (SEO 문제)
- `'use client'` 지시어 사용 (Server Component 기본)
- 인라인 스타일 사용

### ✅ 권장사항
- 여러 데이터 페칭 시 `Promise.all` 사용
- initialData props로 Client Component에 전달
- 타이틀은 중앙 정렬 (`text-center`)

---

## 레퍼런스

- [app/(main)/todos/page.tsx](app/(main)/todos/page.tsx)
- [app/(main)/categories/page.tsx](app/(main)/categories/page.tsx)
