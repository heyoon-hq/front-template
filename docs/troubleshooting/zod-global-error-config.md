# Zod v4 글로벌 에러 설정이 API 라우트에서 적용되지 않는 문제

## 환경

- Next.js 16.1.6 (Turbopack dev mode)
- Zod v4 (4.3.6), import path: `"zod/v4"`
- App Router + API Routes

## 증상

`z.config({ customError })`로 글로벌 한국어 에러 메시지를 설정했으나, API 라우트를 통한 요청에서는 Zod 기본 영어 메시지가 반환됨.

```json
{
  "success": false,
  "error": "Too big: expected string to have <=30 characters"
}
```

기대한 응답:
```json
{
  "success": false,
  "error": "30자 이내로 입력해주세요"
}
```

## 시도한 방법들

### 1차: `app/layout.tsx`에서 사이드이펙트 import

```typescript
// app/layout.tsx
import "@/lib/zod-config"
```

**결과: 실패**

- 페이지 렌더링(Server Components, Server Actions)에서는 동작
- API 라우트(`app/api/`)는 `layout.tsx`를 거치지 않으므로 미적용

### 2차: 서비스 파일마다 import 추가

```typescript
// server/services/category.service.ts
import "@/lib/zod-config"
```

**결과: 성공하지만 비효율적**

- 서비스 파일이 늘어날 때마다 매번 추가해야 함
- 빠뜨리면 해당 서비스에서만 영어 메시지 노출

### 3차: `instrumentation.ts` 사용

```typescript
// instrumentation.ts
export async function register() {
  await import("@/lib/zod-config")
}
```

**결과: 실패**

- `register()` 함수는 정상 호출됨 (로그로 확인)
- 그러나 API 라우트에서 `z.config()` 설정이 적용되지 않음
- 원인: Turbopack이 `instrumentation.ts`와 API 라우트를 별도의 모듈 캐시 공간으로 관리

## 근본 원인: Turbopack의 모듈 인스턴스 분리

Turbopack(dev mode)은 성능 최적화를 위해 모듈을 독립적인 컨텍스트로 로드한다.
이로 인해 같은 `"zod/v4"`를 import해도 **서로 다른 모듈 인스턴스**가 생길 수 있다.

```
[캐시 공간 A - instrumentation.ts]
  "zod/v4" → Zod 인스턴스 A → z.config() 적용됨 ✅

[캐시 공간 B - API 라우트]
  "zod/v4" → Zod 인스턴스 B → config 없음 ❌
```

`z.config()`는 내부적으로 `Object.assign(globalConfig, newConfig)`로 모듈 레벨 싱글턴을 변이시킨다.
그런데 Zod 인스턴스가 다르면 `globalConfig` 객체 자체가 다르므로 설정이 공유되지 않는다.

## 해결: `z`를 re-export하는 래퍼 모듈

```typescript
// lib/zod-config.ts
import { z } from "zod/v4"

z.config({
  customError: (issue) => {
    // 한국어 에러 메시지 설정...
  },
})

export { z }
```

모든 파일에서 `"zod/v4"` 대신 `"@/lib/zod-config"`에서 `z`를 import:

```typescript
// Before (실패)
import { z } from "zod/v4"

// After (성공)
import { z } from "@/lib/zod-config"
```

### 이 방식이 동작하는 이유

1. `z.config()`와 `export { z }`가 **같은 파일**에 있으므로, `z`를 받는 순간 config이 이미 적용된 상태
2. ES 모듈 캐시에 의해 `zod-config.ts`는 **최초 1회만 실행**되고, 이후 import는 캐시된 `z`를 반환
3. 모든 파일이 같은 `zod-config.ts`를 거치므로 **같은 Zod 인스턴스**를 공유

```
lib/zod-config.ts (최초 1회 실행)
  └─ import "zod/v4" → z.config() 호출 → export { z }

lib/validations/category.ts → import { z } from "@/lib/zod-config" → 캐시된 z (설정됨 ✅)
lib/validations/todo.ts     → import { z } from "@/lib/zod-config" → 캐시된 z (설정됨 ✅)
server/dto/category.dto.ts  → import { z } from "@/lib/zod-config" → 캐시된 z (설정됨 ✅)
server/dto/todo.dto.ts      → import { z } from "@/lib/zod-config" → 캐시된 z (설정됨 ✅)
```

## 교훈

- Turbopack dev mode에서는 `"zod/v4"` 같은 외부 패키지도 **단일 인스턴스가 보장되지 않는다**
- `instrumentation.ts`의 `register()`는 호출되지만, 그 안에서 설정한 글로벌 상태가 다른 모듈 컨텍스트와 공유되지 않을 수 있다
- 글로벌 설정이 필요한 라이브러리는 **래퍼 모듈을 통해 설정과 사용을 하나의 모듈 체인으로 묶는 것**이 가장 안전하다
- 이 문제는 production build(`next build && next start`)에서는 발생하지 않을 수 있으나, dev/prod 동작 차이를 만들지 않기 위해 래퍼 방식을 권장한다

## 관련 파일

- `lib/zod-config.ts` — Zod 글로벌 에러 설정 + z re-export
- `lib/validations/todo.ts` — `@/lib/zod-config`에서 z import
- `lib/validations/category.ts` — `@/lib/zod-config`에서 z import
- `server/dto/todo.dto.ts` — `@/lib/zod-config`에서 z import
- `server/dto/category.dto.ts` — `@/lib/zod-config`에서 z import
