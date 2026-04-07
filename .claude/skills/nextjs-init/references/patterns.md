# Code Patterns

스킬이 생성할 `.claude/rules/patterns/` 파일들의 원본입니다. 각 패턴은 해당 경로 작업 시 자동 로드됩니다.

---

## patterns/page.md

```markdown
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

## 페이지의 관심사

페이지 컴포넌트는 **조립(Composition)**만 담당합니다.

### 페이지가 하는 일
1. **데이터 페칭** — Server Actions 호출, 병렬 페칭 시 `Promise.all`
2. **레이아웃 구조** — 래퍼, 타이틀, 섹션 구분
3. **컴포넌트 조립** — 하위 컴포넌트 배치, `initialData` props 전달

### 페이지가 하지 말아야 할 일
- 비즈니스 로직, 상태 관리, 이벤트 핸들러, UI 세부 구현

## 코드 예시

### 데이터 페칭이 있는 페이지
\```tsx
import type { Metadata } from "next"
import { getData } from "@/server/actions/feature"
import { FeatureList } from "@/components/feature/feature-list"

export const metadata: Metadata = {
  title: "기능 목록 | {projectTitle}",
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
\```
```

---

## patterns/components.md

```markdown
---
paths:
  - "components/**"
---

# 컴포넌트 패턴

## 접미사별 역할

| 접미사 | S/C | 역할 | 생성 조건 |
|--------|:---:|------|-----------|
| `-form` | Client | 입력 → mutation 훅으로 create/update | 생성/수정 기능 있으면 |
| `-item` | Client | 개별 항목 CRUD 상호작용 | 목록 + 수정/삭제 있으면 |
| `-list` | S/C | 목록 표시. 필터 있으면 `-filtered-list` | 목록 있으면 |
| `-filter`, `-select` | Client | 제어 컴포넌트 (value+onChange) | 필터/선택 UI 있으면 |
| `-badge`, `-header`, `-status` | Server | 순수 표시 (props만으로 렌더링) | 라벨/상태 표시 시 |
| `-effect` | Client | 애니메이션/피드백 (trigger 기반) | 시각적 피드백 시 |

## Server/Client 판단
- useState, useEffect, onClick, useQuery 필요 → `"use client"`
- props만 받아서 렌더링 → Server Component (기본)

## shadcn/ui 필수 사용
- raw HTML 폼 요소 금지 (`<button>`, `<input>`, `<select>`, `<textarea>`)
- 설치된 컴포넌트: Button, Input, Checkbox, Badge, Card, Select, Popover, Calendar
- 미설치 시: `pnpm dlx shadcn@latest add {컴포넌트}`

## 데이터 흐름
- Page에서 Server Actions(read) 호출 → initialData props로 전달
- Form/Item에서 mutation 훅 사용
- initialData → useQuery로 CSR 관리, mutation → invalidateQueries로 캐시 갱신
```

---

## patterns/hooks.md

```markdown
---
paths:
  - "hooks/**"
---

# TanStack Query 훅 패턴

## 규칙
- `"use client"` 필수
- 파일명: `use-{feature}.ts` (kebab-case, 복수형)
- 한 파일에 해당 feature의 모든 훅 포함

## queryKey 컨벤션
- 기본: `["{feature}"]` (복수형)
- 상세: `["{feature}", { id }]`

## API Route 연동
- queryFn/mutationFn에서 `fetch("/api/{feature}")` 호출
- 응답 타입: `ApiResponse<T>` (`{ success: true, data: T }`)

## initialData 패턴
Page → Server Action → props → useQuery({ queryFn, initialData })

## 코드 예시
\```typescript
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export function useFoos(initialData?: Foo[]) {
  return useQuery({
    queryKey: ["foos"],
    queryFn: async () => {
      const res = await fetch("/api/foos")
      if (!res.ok) throw new Error("Failed to fetch")
      const json: ApiResponse<Foo[]> = await res.json()
      return json.data
    },
    initialData,
  })
}

export function useCreateFoo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { title: string }) => {
      const res = await fetch("/api/foos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["foos"] }),
  })
}
\```
```

---

## patterns/server-actions.md

```markdown
---
paths:
  - "server/actions/**"
---

# Server Actions 패턴

## 역할
- SSR 초기 데이터 제공 + Service 계층 위임 래퍼

## 규칙
- `"use server"` 파일 최상단 필수
- 비즈니스 로직은 Service 계층에 위임
- try/catch 에러 처리, 한국어 에러 메시지

## 코드 예시
\```typescript
"use server"

import { FooService } from "@/server/services/foo.service"

type ActionResult = { success: true } | { success: false; error: string }

export async function getFoos() {
  return FooService.findAll()
}

export async function createFoo(formData: FormData): Promise<ActionResult> {
  try {
    await FooService.create({ title: formData.get("title") as string })
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "생성할 수 없습니다" }
  }
}
\```
```

---

## patterns/api-routes.md

```markdown
---
paths:
  - "app/api/**"
---

# API Route 패턴

## 역할
- HTTP 메서드별 Controller 위임 (얇은 래퍼)

## 파일 구조
\```
app/api/{feature}/
  route.ts              # GET(전체), POST(생성)
  [id]/route.ts         # PATCH(수정), DELETE(삭제)
\```

## 코드 예시

### route.ts
\```typescript
import { NextRequest } from "next/server"
import { FooController } from "@/server/controllers/foo.controller"

export async function GET() { return FooController.getAll() }
export async function POST(request: NextRequest) { return FooController.create(request) }
\```

### [id]/route.ts
\```typescript
import { NextRequest } from "next/server"
import { FooController } from "@/server/controllers/foo.controller"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return FooController.update(id, request)
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return FooController.delete(id)
}
\```
```

---

## patterns/controllers.md

```markdown
---
paths:
  - "server/controllers/**"
---

# Controller 패턴

## 역할
- HTTP 요청 파싱 + Service 호출 + API 응답 포맷

## 규칙
- 객체 리터럴로 export (`export const FooController = { ... }`)
- `ApiResponse.success` / `ApiResponse.error`로 응답

## 코드 예시
\```typescript
import { NextRequest, NextResponse } from "next/server"
import { FooService } from "@/server/services/foo.service"
import { ApiResponse } from "@/lib/api/response"

export const FooController = {
  async getAll() {
    try {
      const items = await FooService.findAll()
      return NextResponse.json(ApiResponse.success(items), { status: 200 })
    } catch (error) {
      return NextResponse.json(ApiResponse.error(error instanceof Error ? error.message : "서버 오류"), { status: 500 })
    }
  },
  async create(request: NextRequest) {
    try {
      const body = await request.json()
      const item = await FooService.create(body)
      return NextResponse.json(ApiResponse.success(item), { status: 201 })
    } catch (error) {
      return NextResponse.json(ApiResponse.error(error instanceof Error ? error.message : "생성 실패"), { status: 400 })
    }
  },
  async update(id: string, request: NextRequest) {
    try {
      const body = await request.json()
      const item = await FooService.update(id, body)
      return NextResponse.json(ApiResponse.success(item), { status: 200 })
    } catch (error) {
      return NextResponse.json(ApiResponse.error(error instanceof Error ? error.message : "수정 실패"), { status: 404 })
    }
  },
  async delete(id: string) {
    try {
      await FooService.delete(id)
      return NextResponse.json(ApiResponse.success(null), { status: 200 })
    } catch (error) {
      return NextResponse.json(ApiResponse.error(error instanceof Error ? error.message : "삭제 실패"), { status: 404 })
    }
  },
}
\```
```

---

## patterns/services.md

```markdown
---
paths:
  - "server/services/**"
  - "server/dto/**"
---

# Service 계층 + DTO 패턴

## 역할
- **Service**: 비즈니스 로직 + DTO Zod 검증 + Prisma 쿼리
- **DTO**: `lib/validations/` 스키마 재사용하여 Request/Response 타입 정의

## 규칙
- 객체 리터럴로 export
- DTO safeParse → 실패 시 throw Error
- Prisma는 `@/server/db/prisma`에서 import
- `z`는 `@/lib/zod-config`에서 import

## 코드 예시

### DTO
\```typescript
import { z } from "@/lib/zod-config"
import { createFooSchema, updateFooSchema } from "@/lib/validations/foo"

export const createFooDtoSchema = createFooSchema
export type CreateFooDto = z.infer<typeof createFooDtoSchema>

export const updateFooDtoSchema = updateFooSchema.omit({ id: true })
export type UpdateFooDto = z.infer<typeof updateFooDtoSchema>
\```

### Service
\```typescript
import { prisma } from "@/server/db/prisma"
import { createFooDtoSchema, updateFooDtoSchema } from "@/server/dto/foo.dto"
import type { CreateFooDto, UpdateFooDto } from "@/server/dto/foo.dto"

export const FooService = {
  async findAll() {
    try { return await prisma.foo.findMany({ orderBy: { createdAt: "desc" } }) }
    catch { throw new Error("목록을 조회할 수 없습니다") }
  },
  async create(data: CreateFooDto) {
    const parsed = createFooDtoSchema.safeParse(data)
    if (!parsed.success) throw new Error(parsed.error.issues[0].message)
    try { return await prisma.foo.create({ data: { title: parsed.data.title } }) }
    catch { throw new Error("생성할 수 없습니다") }
  },
}
\```
```

---

## patterns/validations.md

```markdown
---
paths:
  - "lib/validations/**"
---

# Validation 패턴

## 규칙
- `import { z } from "@/lib/zod-config"` (한국어 에러 메시지, `zod/v4` 직접 import 금지)
- 스키마명: camelCase + Schema, 타입명: PascalCase + Input

## 코드 예시
\```typescript
import { z } from "@/lib/zod-config"

export const createFooSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200, "200자 이내로 입력해주세요"),
})

export const updateFooSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
})

export type CreateFooInput = z.infer<typeof createFooSchema>
\```
```

---

## patterns/prisma.md

```markdown
---
paths:
  - "prisma/**"
---

# Prisma 스키마 패턴

## 모델 네이밍
- 모델명: PascalCase 단수형, 필드명: camelCase

## 필수 필드
\```prisma
model Example {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
\```

## 멀티파일 스키마
- `base.prisma`: generator + datasource만
- 도메인별 1파일 1모델 (`todo.prisma`, `category.prisma`)
- 파일 간 모델 참조 시 import 불필요

## 금지
- `enum` 사용 금지 → String + Zod 검증
- PrismaClient 직접 생성 금지 → `@/server/db/prisma`
```
