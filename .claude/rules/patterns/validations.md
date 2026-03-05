---
paths:
  - "lib/validations/**"
---

# Validation 패턴

## 규칙
- 파일명: `{feature}.ts` (kebab-case)
- 스키마명: camelCase + Schema (`createTodoSchema`)
- 타입명: PascalCase + Input (`CreateTodoInput`)
- `import { z } from "zod/v4"` (v4 전용)
- 에러 메시지: 한국어

## 코드 예시

```typescript
import { z } from "zod/v4"

export const createFooSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200, "200자 이내로 입력해주세요"),
})

export const updateFooSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
})

export const deleteFooSchema = z.object({
  id: z.string(),
})

export type CreateFooInput = z.infer<typeof createFooSchema>
export type UpdateFooInput = z.infer<typeof updateFooSchema>
```

## 패턴
- Create: 모든 필드 필수, 상세 에러 메시지
- Update: id 필수 + 나머지 optional
- Delete: id만
- 타입 추론: `z.infer<typeof schema>`로 중복 타입 방지

## 레퍼런스
- `lib/validations/todo.ts`
- `lib/validations/category.ts`
