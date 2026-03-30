---
paths:
  - "server/controllers/**"
---

# Controller 패턴

## 역할
- HTTP 요청 파싱 + Service 호출 + API 응답 포맷
- API Route에서 호출됨

## 규칙
- 파일명: `{feature}.controller.ts`
- 객체 리터럴로 export (`export const FooController = { ... }`)
- Service 호출 + `createApiResponse` / `createErrorResponse`로 응답
- HTTP 상태 코드: 200(성공), 201(생성), 400(입력오류), 404(미발견), 500(서버오류)

## 코드 예시

```typescript
import { NextRequest, NextResponse } from "next/server"
import { FooService } from "@/server/services/foo.service"
import { createApiResponse, createErrorResponse } from "@/lib/api/response"

export const FooController = {
  async getAll() {
    try {
      const items = await FooService.findAll()
      return NextResponse.json(createApiResponse(items), { status: 200 })
    } catch (error) {
      return NextResponse.json(
        createErrorResponse(
          error instanceof Error ? error.message : "서버 오류"
        ),
        { status: 500 }
      )
    }
  },

  async create(request: NextRequest) {
    try {
      const body = await request.json()
      const item = await FooService.create(body)
      return NextResponse.json(createApiResponse(item), { status: 201 })
    } catch (error) {
      return NextResponse.json(
        createErrorResponse(
          error instanceof Error ? error.message : "생성 실패"
        ),
        { status: 400 }
      )
    }
  },

  async update(id: string, request: NextRequest) {
    try {
      const body = await request.json()
      const item = await FooService.update(id, body)
      return NextResponse.json(createApiResponse(item), { status: 200 })
    } catch (error) {
      return NextResponse.json(
        createErrorResponse(
          error instanceof Error ? error.message : "수정 실패"
        ),
        { status: 404 }
      )
    }
  },

  async delete(id: string) {
    try {
      await FooService.delete(id)
      return NextResponse.json(createApiResponse(null), { status: 200 })
    } catch (error) {
      return NextResponse.json(
        createErrorResponse(
          error instanceof Error ? error.message : "삭제 실패"
        ),
        { status: 404 }
      )
    }
  },
}
```

## 레퍼런스
- `server/controllers/todo.controller.ts`
- `server/controllers/category.controller.ts`
- `lib/api/response.ts`
