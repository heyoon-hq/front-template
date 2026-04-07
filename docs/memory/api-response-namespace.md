# API 응답 유틸 네이밍: 네임스페이스 패턴 채택

> **결정일**: 2026-03-30
> **상태**: 채택
> **관련 파일**: `lib/api/response.ts`

## 배경

`createApiResponse` / `createErrorResponse` 함수명을 `apiSuccess` / `apiError`로 변경하자는 제안이 있었다.
이에 대해 세 가지 선택지를 검토하고, 네임스페이스 객체 패턴을 채택했다.

## 선택지 비교

### 1. 기존 유지 — `createApiResponse` / `createErrorResponse`

```typescript
import { createApiResponse, createErrorResponse } from "@/lib/api/response"
return NextResponse.json(createApiResponse(data))
```

- 장점: 동사 시작 — "함수는 동사" 관례 충족
- 단점: 이름이 길고, 함수가 늘어나면 임포트도 함께 늘어남

### 2. 제안 — `apiSuccess` / `apiError`

```typescript
import { apiSuccess, apiError } from "@/lib/api/response"
return NextResponse.json(apiSuccess(data))
```

- 장점: 짧고 직관적
- 단점: 동사가 없어 함수인지 상수/객체인지 모호. `api*` 접두사 네임스페이스 오염 (아래 예시 참조)

#### `api*` 접두사 네임스페이스 오염이란?

프로젝트가 커지면서 `api` 접두사 함수가 여러 파일에서 늘어나는 상황:

```typescript
// IDE 자동완성에서 "api"를 치면 이 모든 게 한꺼번에 뜸
apiSuccess(data)          // lib/api/response.ts
apiError(msg)             // lib/api/response.ts
apiPaginated(data, total) // lib/api/response.ts (나중에 추가)
apiLog(msg)               // lib/api/logger.ts
apiRetry(fn)              // lib/api/retry.ts
apiCache(key)             // lib/api/cache.ts
apiTimeout(ms)            // lib/api/timeout.ts
apiHeaders()              // lib/api/headers.ts
```

"응답 포맷 함수만 찾고 싶은데" `api`로 시작하는 무관한 함수들이 전부 섞여서 나온다.

네임스페이스 객체로 묶으면 `.` 이후에 해당 그룹의 멤버만 노출된다:

```typescript
// "ApiResponse."을 치면 응답 관련만 나옴
ApiResponse.success(data)
ApiResponse.error(msg)
ApiResponse.paginated(data, total)

// 다른 유틸은 각자의 네임스페이스에 격리
ApiLogger.log(msg)
ApiCache.get(key)
```

### 3. 채택 — `ApiResponse.success` / `ApiResponse.error`

```typescript
import { ApiResponse } from "@/lib/api/response"
return NextResponse.json(ApiResponse.success(data))
```

- 장점: 프로젝트 기존 패턴과 일치, 임포트 항상 한 줄, 자동완성 시 관련 함수만 노출
- 단점: tree-shaking 불가 (이 파일은 2개 함수라 무의미)

## 채택 근거

### 1. 프로젝트 내부 일관성

이 프로젝트의 모든 계층이 `export const Xxx = { method() }` 패턴을 사용한다:

| 계층 | 예시 |
|------|------|
| Controller | `CategoryController.getAll()`, `TodoController.create()` |
| Service | `CategoryService.findAll()`, `TodoService.create()` |
| **Response (변경 후)** | `ApiResponse.success()`, `ApiResponse.error()` |

개별 함수 패턴(`apiSuccess`)은 이 코드베이스에서 유일하게 다른 컨벤션이 된다.

### 2. 업계 API 사례 — `Namespace.method()` 호출 패턴

| 라이브러리 | 호출 방식 | 구현 메커니즘 |
|-----------|----------|-------------|
| Web API 표준 | `Response.json()`, `Response.redirect()` | class static method |
| Next.js | `NextResponse.json()`, `NextResponse.redirect()` | class (extends Response) |
| Zod | `z.string()`, `z.object()` | module namespace re-export |
| Effect-TS | `Effect.succeed()`, `Effect.fail()` | module namespace import |
| Prisma | `Prisma.validator()` | codegen namespace |

구현 메커니즘은 class, module re-export 등 다양하지만, **호출부에서의 사용 경험은 모두 동일**하다.
이 프로젝트는 `enum`과 `class`를 금지하므로, plain object literal이 가장 적합한 구현이다.

### 3. 개별 함수 패턴을 쓰는 사례도 있다

| 라이브러리 | 호출 방식 |
|-----------|----------|
| neverthrow | `ok(data)`, `err(msg)` |
| superjson | `serialize()`, `deserialize()` |

업계에서 어느 한쪽이 정답이라는 합의는 없다.
**이 프로젝트에서는** 기존 패턴 일관성이 결정적 근거였다.

## 변경 내역

### Before

```typescript
export function createApiResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}
export function createErrorResponse(error: string): ApiErrorResponse {
  return { success: false, error }
}
```

### After

```typescript
export const ApiResponse = {
  success: <T>(data: T): ApiSuccessResponse<T> => ({ success: true, data }),
  error: (error: string): ApiErrorResponse => ({ success: false, error }),
}
```

### 영향 받은 파일

| 파일 | 변경 내용 |
|------|----------|
| `lib/api/response.ts` | 개별 함수 → `ApiResponse` 네임스페이스 객체 |
| `lib/api/error-handler.ts` | `createErrorResponse()` → `ApiResponse.error()` |
| `server/controllers/category.controller.ts` | 임포트 및 호출부 변경 |
| `server/controllers/todo.controller.ts` | 임포트 및 호출부 변경 |
| `.claude/rules/structure.md` | 주석 동기화 |
| `.claude/rules/patterns/controllers.md` | 코드 예시 및 규칙 설명 동기화 |

## 알려진 트레이드오프

| 항목 | 설명 |
|------|------|
| Tree-shaking | 객체 속성은 번들러가 개별 제거 불가. 단, 이 파일은 2개 함수라 실질 영향 없음 |
| 테스트 모킹 | `vi.mock`으로 개별 import 모킹이 더 간단. 필요 시 `vi.spyOn(ApiResponse, 'success')` 사용 |
| ES 모듈 철학 | "모듈 자체가 네임스페이스"라는 관점에서는 과잉 래핑. 이 프로젝트에서는 이미 모든 계층이 이 패턴이므로 일관성을 우선함 |
