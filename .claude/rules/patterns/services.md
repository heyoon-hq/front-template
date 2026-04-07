---
paths:
  - "server/services/**"
  - "server/dto/**"
---

# Service 계층 + DTO 패턴

## 역할
- **Service**: 비즈니스 로직 + DTO를 통한 Zod 검증 + Prisma 쿼리 (핵심 계층)
- **DTO**: `lib/validations/` 스키마를 재사용하여 Request/Response 타입 정의

## 파일 구조
```
server/services/{feature}.service.ts   # 비즈니스 로직
server/dto/{feature}.dto.ts            # DTO 스키마 + 타입
lib/validations/{feature}.ts           # 기본 Zod 스키마 (DTO에서 import)
```

## Service 규칙
- 파일명: `{feature}.service.ts`
- 객체 리터럴로 export (`export const FooService = { ... }`)
- DTO 스키마로 입력 검증 (safeParse) → 실패 시 throw Error
- Prisma는 `@/server/db/prisma`에서 import
- 에러 메시지: 한국어

## DTO 규칙
- 파일명: `{feature}.dto.ts`
- `lib/validations/`의 기본 스키마를 재사용 (중복 정의 X)
- Request DTO: 기본 스키마 그대로 또는 `.omit()` 등으로 변환
- Response DTO: API 응답 형태 정의
- Zod의 `z`는 `@/lib/zod-config`에서 import (한국어 에러 메시지)

## 코드 예시

### DTO (server/dto/foo.dto.ts)
```typescript
import { z } from "@/lib/zod-config"
import { createFooSchema, updateFooSchema } from "@/lib/validations/foo"

// Request DTOs (기존 스키마 재사용)
export const createFooDtoSchema = createFooSchema
export type CreateFooDto = z.infer<typeof createFooDtoSchema>

export const updateFooDtoSchema = updateFooSchema.omit({ id: true })
export type UpdateFooDto = z.infer<typeof updateFooDtoSchema>

// Response DTO
export const fooResponseDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.date(),
})
export type FooResponseDto = z.infer<typeof fooResponseDtoSchema>
```

### Service (server/services/foo.service.ts)
```typescript
import { prisma } from "@/server/db/prisma"
import {
  createFooDtoSchema,
  updateFooDtoSchema,
} from "@/server/dto/foo.dto"
import type { CreateFooDto, UpdateFooDto } from "@/server/dto/foo.dto"

export const FooService = {
  async findAll() {
    try {
      return await prisma.foo.findMany({
        orderBy: { createdAt: "desc" },
      })
    } catch (error) {
      throw new Error("목록을 조회할 수 없습니다")
    }
  },

  async create(data: CreateFooDto) {
    const parsed = createFooDtoSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message)
    }

    try {
      return await prisma.foo.create({
        data: { title: parsed.data.title },
      })
    } catch (error) {
      throw new Error("생성할 수 없습니다")
    }
  },

  async update(id: string, data: UpdateFooDto) {
    const parsed = updateFooDtoSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message)
    }

    try {
      return await prisma.foo.update({
        where: { id },
        data: parsed.data,
      })
    } catch (error) {
      throw new Error("찾을 수 없습니다")
    }
  },

  async delete(id: string) {
    try {
      await prisma.foo.delete({ where: { id } })
    } catch (error) {
      throw new Error("찾을 수 없습니다")
    }
  },
}
```

## 검증 흐름
```
Client → API Route → Controller → Service(DTO safeParse) → Prisma
                                     ↑ 여기서 Zod 검증
```

## 레퍼런스
- `server/services/todo.service.ts`, `server/services/category.service.ts`
- `server/dto/todo.dto.ts`, `server/dto/category.dto.ts`
- `lib/validations/todo.ts`, `lib/validations/category.ts`
