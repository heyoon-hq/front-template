---
paths:
  - "app/api/**"
---

# API Route 패턴

## 역할
- HTTP 메서드별 Controller 위임 (얇은 래퍼)
- Route 파일에 비즈니스 로직 없음

## 규칙
- HTTP 메서드: GET, POST, PATCH, DELETE
- Controller에 위임만 함
- dynamic route params: `context.params`는 Promise (await 필수)

## 파일 구조
```
app/api/{feature}/
  route.ts              # GET(전체), POST(생성)
  [id]/route.ts         # PATCH(수정), DELETE(삭제)
```

## 코드 예시

### route.ts
```typescript
import { NextRequest } from "next/server"
import { FooController } from "@/server/controllers/foo.controller"

export async function GET() {
  return FooController.getAll()
}

export async function POST(request: NextRequest) {
  return FooController.create(request)
}
```

### [id]/route.ts
```typescript
import { NextRequest } from "next/server"
import { FooController } from "@/server/controllers/foo.controller"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return FooController.update(id, request)
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return FooController.delete(id)
}
```

## 응답 포맷
```typescript
// 성공
{ success: true, data: T }

// 실패
{ success: false, error: "에러 메시지" }
```

## 레퍼런스
- `app/api/todos/route.ts`, `app/api/todos/[id]/route.ts`
- `app/api/categories/route.ts`, `app/api/categories/[id]/route.ts`
