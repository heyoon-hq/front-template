# Design: 프로젝트 구조 감사 및 보완

> Plan 문서: `docs/01-plan/features/project-structure-audit.plan.md`

## 1. 수정 범위 요약

| Tier | 건수 | 수정 파일 수 |
|------|------|------------|
| Tier 1 (즉시) | 7건 | 8파일 |
| Tier 2 (릴리스 전) | 4건 | 5파일 + 마이그레이션 |
| **합계** | **11건** | **13파일** |

Tier 3(타입 중앙화, 홈 페이지 구조)는 아키텍처 결정이 필요하므로 이번 범위에서 제외.

---

## 2. Tier 1: 즉시 수정 — 상세 설계

### T1-1. Service 에러 로깅 추가 (S-01)

**대상 파일**: `server/services/todo.service.ts`, `server/services/category.service.ts`

**현재 코드** (모든 catch 블록):
```typescript
catch (error) {
  throw new Error("할 일을 생성할 수 없습니다")
}
```

**수정 후**:
```typescript
catch (error) {
  console.error("[TodoService.create]", error)
  throw new Error("할 일을 생성할 수 없습니다")
}
```

**적용 범위** (8개 catch 블록):
- `todo.service.ts`: findAll, create, update, delete (4곳)
- `category.service.ts`: findAll, create, update, delete (4곳)

**로그 형식**: `[ServiceName.methodName]` 접두사로 어떤 메서드에서 발생했는지 식별

---

### T1-2. Category DTO 스키마 재사용 (C-01)

**대상 파일**: `server/dto/category.dto.ts`

**현재 코드**:
```typescript
import { createCategorySchema, updateCategorySchema } from "@/lib/validations/category"

// import만 하고 createCategorySchema 미사용 — 새로 정의
export const createCategoryDtoSchema = z.object({
  name: z.string().min(1, "카테고리 이름을 입력해주세요").max(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "올바른 색상 코드를 입력해주세요").optional(),
})
```

**문제**: `createCategorySchema`에는 `default("#6B7280")`가 있으나 DTO에는 없음 → 동작 차이.
단, Service에서 `parsed.data.color ?? "#3b82f6"`로 별도 기본값을 적용하고 있어 실제 기본 색상이 불일치:
- validations: `#6B7280` (회색)
- Service: `#3b82f6` (파란색)

**수정 후**:
```typescript
import { createCategorySchema, updateCategorySchema } from "@/lib/validations/category"

// Request DTOs (기존 스키마 재사용)
export const createCategoryDtoSchema = createCategorySchema
export type CreateCategoryDto = z.infer<typeof createCategoryDtoSchema>

export const updateCategoryDtoSchema = updateCategorySchema.omit({ id: true })
export type UpdateCategoryDto = z.infer<typeof updateCategoryDtoSchema>
```

**연쇄 수정**: `category.service.ts:32`의 `color: parsed.data.color ?? "#3b82f6"` → `color: parsed.data.color`
- `createCategorySchema`의 default가 `#6B7280`이므로 safeParse 후 color는 항상 존재
- Service에서의 별도 기본값 `#3b82f6`는 불필요 (스키마 default로 통일)

**기본 색상 통일**: `#6B7280` (validations 스키마의 default 값 사용)

---

### T1-3. Controller `handleApiError` 활용 (C-02)

**결정**: `handleApiError` 유틸을 Controller에서 **활용**한다 (제거가 아닌 활용).

**대상 파일**: `server/controllers/todo.controller.ts`, `server/controllers/category.controller.ts`

**현재 코드** (반복 패턴 — 8곳):
```typescript
catch (error) {
  return NextResponse.json(
    ApiResponse.error(
      error instanceof Error ? error.message : "서버 오류"
    ),
    { status: 500 }
  )
}
```

**수정 후**:
```typescript
catch (error) {
  return handleApiError(error, "서버 오류", 500)
}
```

**import 추가**: 각 Controller 상단에 `import { handleApiError } from "@/lib/api/error-handler"`

**매핑표** (메서드별 기본 메시지 + 상태 코드):

| Controller | 메서드 | 기본 메시지 | 상태 코드 |
|-----------|--------|-----------|---------|
| Todo/Category | getAll | "서버 오류" | 500 |
| Todo/Category | create | "생성 실패" | 400 |
| Todo/Category | update | "수정 실패" | 404 |
| Todo/Category | delete | "삭제 실패" | 404 |

---

### T1-4. `TodoFilter` 타입명 충돌 해소 (C-03)

**대상 파일**: `components/todo/todo-filtered-list.tsx`

**현재 코드**:
```typescript
import { TodoFilter } from "./todo-filter"     // 컴포넌트
type TodoFilter = "all" | "active" | "completed" // 타입 — 이름 충돌
```

**수정 후**:
```typescript
import { TodoFilter } from "./todo-filter"
type TodoFilterValue = "all" | "active" | "completed"
```

**연쇄 수정**: 같은 파일 내 `useState<TodoFilter>` → `useState<TodoFilterValue>`

---

### T1-5. `.env.example` 생성 (S-02)

**신규 파일**: `.env.example`

**내용**:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/my_app_db"
```

---

### T1-6. Response DTO 제거 (C-04)

**결정**: 현재 어디에서도 사용되지 않고, Controller가 Service 반환값을 그대로 전달하므로 **제거**한다.

**대상 파일**: `server/dto/todo.dto.ts`, `server/dto/category.dto.ts`

**todo.dto.ts — 제거할 부분**:
```typescript
// 아래 전체 제거
export const todoResponseDtoSchema = z.object({ ... })
export type TodoResponseDto = z.infer<typeof todoResponseDtoSchema>
```

**category.dto.ts — 제거할 부분**:
```typescript
// 아래 전체 제거
export const categoryResponseDtoSchema = z.object({ ... })
export type CategoryResponseDto = z.infer<typeof categoryResponseDtoSchema>
```

**todo.dto.ts에서 `z` import도 불필요해짐**: `createTodoSchema`가 이미 `z`를 사용한 스키마이므로, DTO 파일에서 `z`를 직접 import할 필요 없음. 단, `updateTodoDtoSchema`에서 `.omit()`을 사용하므로 `z` import는 Zod의 타입 추론을 위해 유지.

**최종 todo.dto.ts**:
```typescript
import type { z } from "@/lib/zod-config"
import { createTodoSchema, updateTodoSchema } from "@/lib/validations/todo"

export const createTodoDtoSchema = createTodoSchema
export type CreateTodoDto = z.infer<typeof createTodoDtoSchema>

export const updateTodoDtoSchema = updateTodoSchema.omit({ id: true })
export type UpdateTodoDto = z.infer<typeof updateTodoDtoSchema>
```

**최종 category.dto.ts**:
```typescript
import type { z } from "@/lib/zod-config"
import { createCategorySchema, updateCategorySchema } from "@/lib/validations/category"

export const createCategoryDtoSchema = createCategorySchema
export type CreateCategoryDto = z.infer<typeof createCategoryDtoSchema>

export const updateCategoryDtoSchema = updateCategorySchema.omit({ id: true })
export type UpdateCategoryDto = z.infer<typeof updateCategoryDtoSchema>
```

---

### T1-7. `ActionResult` 타입 통합 (C-05)

**대상 파일**: `server/actions/todo.ts`, `server/actions/category.ts`

**현재**: 두 파일 모두 동일 타입을 각각 정의
```typescript
type ActionResult = { success: true } | { success: false; error: string }
```

**수정**: 공통 타입 파일 생성

**신규 파일**: `server/actions/types.ts`
```typescript
export type ActionResult = { success: true } | { success: false; error: string }
```

**기존 파일 수정**: 각 파일에서 타입 정의 제거 + import 추가
```typescript
import type { ActionResult } from "@/server/actions/types"
```

---

## 3. Tier 2: 릴리스 전 수정 — 상세 설계

### T2-1. Category `onDelete: SetNull` (S-04)

**대상 파일**: `prisma/schema/todo.prisma`

**현재 코드**:
```prisma
category   Category? @relation(fields: [categoryId], references: [id])
```

**수정 후**:
```prisma
category   Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
```

**마이그레이션**: `npx prisma migrate dev --name add-category-on-delete-set-null`

**효과**: 카테고리 삭제 시 관련 Todo의 categoryId가 자동으로 null 처리

---

### T2-2. Category `updatedAt` 추가 (C-07)

**대상 파일**: `prisma/schema/category.prisma`

**현재 코드**:
```prisma
model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  color     String   @default("#6B7280")
  todos     Todo[]
  createdAt DateTime @default(now())
}
```

**수정 후**:
```prisma
model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  color     String   @default("#6B7280")
  todos     Todo[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**마이그레이션**: T2-1과 함께 `npx prisma migrate dev --name update-category-model`로 통합 가능

**연쇄 수정**: `hooks/use-categories.ts`의 `Category` 타입에 `updatedAt` 필드 추가

---

### T2-3. `error.tsx` / `not-found.tsx` 추가 (C-08)

**신규 파일**: `app/error.tsx`

```typescript
"use client"

import { Button } from "@/components/ui/button"

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">문제가 발생했습니다</h1>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={reset}>다시 시도</Button>
      </div>
    </div>
  )
}
```

**신규 파일**: `app/not-found.tsx`

```typescript
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-muted-foreground">
          요청하신 페이지가 존재하지 않습니다.
        </p>
        <Button asChild>
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </div>
    </div>
  )
}
```

---

### T2-4. `useMemo` 의존성 수정 (C-06)

**대상 파일**: `components/todo/todo-filtered-list.tsx`

**현재 코드**:
```typescript
const filteredTodos = todos.filter((todo) => { ... })

const groupedTodos = useMemo(() => {
  // ...
}, [filteredTodos])  // 매 렌더마다 새 배열 → memo 무효화
```

**수정 후**: `filteredTodos`도 `useMemo`로 감싸기
```typescript
const filteredTodos = useMemo(() =>
  todos.filter((todo) => {
    if (filter === "active" && todo.completed) return false
    if (filter === "completed" && !todo.completed) return false
    if (categoryFilter === "none" && todo.categoryId !== null) return false
    if (categoryFilter !== "all" && categoryFilter !== "none" && todo.categoryId !== categoryFilter) return false
    return true
  }),
  [todos, filter, categoryFilter]
)

const groupedTodos = useMemo(() => {
  // ... 기존 로직
}, [filteredTodos])
```

---

## 4. 구현 순서

마이그레이션이 필요한 Prisma 변경(T2-1, T2-2)을 먼저 처리하고, 나머지는 의존성 순서대로 진행.

```
Step 1: Prisma 스키마 + 마이그레이션
  T2-1 prisma/schema/todo.prisma (onDelete)
  T2-2 prisma/schema/category.prisma (updatedAt)
  → npx prisma migrate dev --name update-category-model

Step 2: DTO 계층 (Service 수정 전에 먼저)
  T1-2 server/dto/category.dto.ts (스키마 재사용)
  T1-6 server/dto/todo.dto.ts, category.dto.ts (Response DTO 제거)

Step 3: Service 계층
  T1-1 server/services/todo.service.ts (에러 로깅)
  T1-1 server/services/category.service.ts (에러 로깅 + color 기본값 제거)

Step 4: Controller 계층
  T1-3 server/controllers/todo.controller.ts (handleApiError)
  T1-3 server/controllers/category.controller.ts (handleApiError)

Step 5: Actions 계층
  T1-7 server/actions/types.ts (신규)
  T1-7 server/actions/todo.ts, category.ts (ActionResult import)

Step 6: 클라이언트
  T1-4 components/todo/todo-filtered-list.tsx (TodoFilterValue + useMemo)
  → T2-4도 같은 파일이므로 함께 처리

Step 7: App Router 에러 경계
  T2-3 app/error.tsx (신규)
  T2-3 app/not-found.tsx (신규)

Step 8: DX
  T1-5 .env.example (신규)

Step 9: 검증
  npx tsc --noEmit
  pnpm build
```

---

## 5. 수정 파일 전체 목록

| # | 파일 | 작업 | 이슈 |
|---|------|------|------|
| 1 | `prisma/schema/todo.prisma` | 수정 | T2-1 |
| 2 | `prisma/schema/category.prisma` | 수정 | T2-2 |
| 3 | `server/dto/todo.dto.ts` | 수정 | T1-6 |
| 4 | `server/dto/category.dto.ts` | 수정 | T1-2, T1-6 |
| 5 | `server/services/todo.service.ts` | 수정 | T1-1 |
| 6 | `server/services/category.service.ts` | 수정 | T1-1, T1-2(연쇄) |
| 7 | `server/controllers/todo.controller.ts` | 수정 | T1-3 |
| 8 | `server/controllers/category.controller.ts` | 수정 | T1-3 |
| 9 | `server/actions/types.ts` | **신규** | T1-7 |
| 10 | `server/actions/todo.ts` | 수정 | T1-7 |
| 11 | `server/actions/category.ts` | 수정 | T1-7 |
| 12 | `components/todo/todo-filtered-list.tsx` | 수정 | T1-4, T2-4 |
| 13 | `app/error.tsx` | **신규** | T2-3 |
| 14 | `app/not-found.tsx` | **신규** | T2-3 |
| 15 | `.env.example` | **신규** | T1-5 |
