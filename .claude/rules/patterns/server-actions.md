---
paths:
  - "server/actions/**"
---

# Server Actions 패턴

## 규칙
- `"use server"` 파일 최상단 필수
- 파일명: `{feature}.ts` (kebab-case)
- 함수명: camelCase (`getTodos`, `createTodo`)

## ActionResult 타입
- Create/Update/Delete → `Promise<ActionResult>` 반환
- Read → Prisma 쿼리 직접 반환 (ActionResult 미사용)

## 캐시 갱신
- TanStack Query 훅이 있는 기능: `revalidatePath` 사용하지 않음 (invalidateQueries가 담당)
- TanStack Query 미사용 기능: `revalidatePath("/")` 사용

## 에러 처리
- try/catch로 감싸기
- 한국어 에러 메시지 (`"생성할 수 없습니다"`, `"찾을 수 없습니다"`)

## 코드 예시

```typescript
"use server"

import { prisma } from "@/server/db/prisma"
import { createFooSchema } from "@/lib/validations/foo"

type ActionResult = { success: true } | { success: false; error: string }

// Read — Prisma 직접 반환
export async function getFoos() {
  return prisma.foo.findMany({ orderBy: { createdAt: "desc" } })
}

// Create — FormData + safeParse
export async function createFoo(formData: FormData): Promise<ActionResult> {
  const parsed = createFooSchema.safeParse({ title: formData.get("title") })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  try {
    await prisma.foo.create({ data: { title: parsed.data.title } })
    return { success: true }
  } catch {
    return { success: false, error: "생성할 수 없습니다" }
  }
}

// Update — 구조체 파라미터
export async function updateFoo(data: { id: string; title?: string }): Promise<ActionResult> {
  const parsed = updateFooSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  try {
    const { id, ...updateData } = parsed.data
    await prisma.foo.update({ where: { id }, data: updateData })
    return { success: true }
  } catch {
    return { success: false, error: "찾을 수 없습니다" }
  }
}
```

## 레퍼런스
- `server/actions/todo.ts`
- `server/actions/category.ts`
