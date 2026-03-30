---
paths:
  - "server/actions/**"
---

# Server Actions 패턴

## 역할
- **SSR 초기 데이터 제공**: Page(Server Component)에서 호출하여 initialData 전달
- **CUD 래퍼**: Service 계층에 위임하는 얇은 래퍼 (직접 Prisma 쿼리 X)

## 규칙
- `"use server"` 파일 최상단 필수
- 파일명: `{feature}.ts` (kebab-case)
- 함수명: camelCase (`getTodos`, `createTodo`)
- 비즈니스 로직은 Service 계층에 위임

## ActionResult 타입
- Create/Update/Delete → `Promise<ActionResult>` 반환
- Read → Service 호출 결과 직접 반환 (ActionResult 미사용)

## 캐시 갱신
- TanStack Query 훅이 있는 기능: `revalidatePath` 사용하지 않음 (invalidateQueries가 담당)
- TanStack Query 미사용 기능: `revalidatePath("/")` 사용

## 에러 처리
- try/catch로 감싸기
- 한국어 에러 메시지 (`"생성할 수 없습니다"`, `"찾을 수 없습니다"`)

## 코드 예시

```typescript
"use server"

import { FooService } from "@/server/services/foo.service"
import { deleteFooSchema } from "@/lib/validations/foo"

type ActionResult = { success: true } | { success: false; error: string }

// Read — Service 위임, 직접 반환
export async function getFoos() {
  return FooService.findAll()
}

// Create — Service에 위임 (Zod 검증은 Service/DTO에서 수행)
export async function createFoo(formData: FormData): Promise<ActionResult> {
  try {
    await FooService.create({
      title: formData.get("title") as string,
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "생성할 수 없습니다",
    }
  }
}

// Update — Service에 위임
export async function updateFoo(
  data: { id: string; title?: string }
): Promise<ActionResult> {
  try {
    const { id, ...updateData } = data
    await FooService.update(id, updateData)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "찾을 수 없습니다",
    }
  }
}

// Delete — 간단한 입력은 Actions에서 safeParse 가능
export async function deleteFoo(
  data: { id: string }
): Promise<ActionResult> {
  const parsed = deleteFooSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    await FooService.delete(parsed.data.id)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "찾을 수 없습니다",
    }
  }
}
```

## 레퍼런스
- `server/actions/todo.ts`
- `server/actions/category.ts`
