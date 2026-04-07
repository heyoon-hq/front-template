# Project Rules

스킬이 생성할 CLAUDE.md와 rules 파일의 원본입니다. `{projectName}`과 `{projectTitle}`을 치환하여 사용합니다.

---

## CLAUDE.md 템플릿

```markdown
# CLAUDE.md

## 응답 규칙
- 모든 질문에 한국어로 답변할 것

## Core Principles

### 우선순위
트레이드오프 발생 시: **정확성 > 유지보수성 > 성능 > 간결함**

### 작업 복잡도 판단
- **Trivial** (단일 파일, 명확한 수정) → 즉시 실행
- **Moderate** (2-5 파일, 명확한 범위) → 간단한 계획 후 실행
- **Complex** (아키텍처 영향, 모호한 요구사항) → 충분한 조사 후 실행

복잡도에 맞는 노력을 투입한다. 단순한 작업을 과도하게, 복잡한 작업을 가볍게 처리하지 않는다.

### 컨텍스트 관리
- 파일 탐색, 코드베이스 조사 등 저수준 작업은 sub-agent에 위임
- 메인 컨텍스트는 조율, 사용자 소통, 전략적 판단에 보존
- 단순하고 범위가 명확한 작업은 오케스트레이션 없이 직접 실행

## 프로젝트 개요
- Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4
- Prisma 6 + PostgreSQL (Docker), Zod v4, pnpm
- UI: shadcn/ui — 서버 상태: TanStack Query + API Routes
- **SSR 초기 데이터**: Page → Server Actions(read) → initialData props → useQuery
- **CSR 읽기/쓰기**: hooks → fetch("/api/...") → Controller → Service → Prisma
- **계층 구조**: API Route → Controller(HTTP) → Service(비즈니스) → Prisma
- Zod safeParse는 Service 계층(DTO)에서 수행

## 개발 명령어
\```bash
docker compose up -d          # PostgreSQL 시작 (필수 선행)
pnpm install                  # 의존성 설치
npx prisma migrate dev        # DB 마이그레이션
pnpm dev                      # 개발 서버 (http://localhost:3000)
pnpm build                    # 빌드
pnpm lint                     # 린트
npx tsc --noEmit              # 타입 체크
\```

## 개발 지침

> **개발 전 반드시 아래 지침 문서를 확인하세요.**

| 문서 | 설명 |
|------|------|
| [rules/structure.md](.claude/rules/structure.md) | 폴더 구조, 파일 배치 규칙 |
| [rules/recipe.md](.claude/rules/recipe.md) | 기능 구현 순서 (10단계), 데이터 흐름 |
| [rules/coding-standards.md](.claude/rules/coding-standards.md) | 네이밍, 임포트, 금지 항목 |
| [rules/verification.md](.claude/rules/verification.md) | 작업 후 필수 체크, 품질 셀프체크 |

### 경로별 코드 패턴 (해당 경로 작업 시 자동 로드)

| 문서 | 트리거 경로 | 설명 |
|------|------------|------|
| [patterns/page.md](.claude/rules/patterns/page.md) | `app/**` | Page 컴포넌트 패턴 |
| [patterns/components.md](.claude/rules/patterns/components.md) | `components/**` | 컴포넌트 접미사, shadcn/ui |
| [patterns/hooks.md](.claude/rules/patterns/hooks.md) | `hooks/**` | TanStack Query 훅 패턴 |
| [patterns/server-actions.md](.claude/rules/patterns/server-actions.md) | `server/actions/**` | Server Actions (SSR 초기 데이터용) |
| [patterns/api-routes.md](.claude/rules/patterns/api-routes.md) | `app/api/**` | API Route 패턴 (Controller 위임) |
| [patterns/controllers.md](.claude/rules/patterns/controllers.md) | `server/controllers/**` | Controller 패턴 (Service 호출 + 응답 포맷) |
| [patterns/services.md](.claude/rules/patterns/services.md) | `server/services/**`, `server/dto/**` | Service 계층 + DTO 패턴 |
| [patterns/validations.md](.claude/rules/patterns/validations.md) | `lib/validations/**` | Zod 스키마 패턴 |
| [patterns/prisma.md](.claude/rules/patterns/prisma.md) | `prisma/**` | Prisma 모델, 멀티파일 스키마 |
```

---

## rules/structure.md

```markdown
---
description: 프로젝트 폴더 구조 및 파일 배치 규칙
---

# 폴더 구조

\```
app/                              # 라우팅 + 페이지
  providers.tsx                   # QueryClientProvider
  layout.tsx                      # Providers 래핑
  (main)/                         # Route Group (도메인별 페이지)
    layout.tsx                    # 공통 네비게이션
    {domain}/page.tsx             # 도메인 페이지
  api/                            # API Routes (CSR 데이터 통신)
    {feature}/
      route.ts                    # GET(전체), POST(생성)
      [id]/route.ts               # PATCH(수정), DELETE(삭제)
components/
  ui/                             # shadcn/ui (자동 생성, 직접 수정 지양)
  layout/                         # 공통 레이아웃 컴포넌트
  {feature}/                      # 기능별 컴포넌트
hooks/                            # TanStack Query 훅
  use-{feature}.ts                # useQuery + useMutation (fetch → API Routes)
server/
  actions/{feature}.ts            # Server Actions (SSR 초기 데이터용, Service 위임)
  controllers/{feature}.controller.ts  # HTTP 요청/응답 처리 (API Route에서 호출)
  services/{feature}.service.ts   # 비즈니스 로직 + Zod 검증 (핵심 계층)
  dto/{feature}.dto.ts            # Request/Response DTO + Zod 스키마
  db/prisma.ts                    # DB 싱글턴 (수정 금지)
lib/
  validations/{feature}.ts        # Zod 기본 스키마 (DTO에서 재사용)
  api/                            # API 응답 포맷 유틸
    response.ts                   # ApiResponse.success, ApiResponse.error
    error-handler.ts              # handleApiError
  utils.ts                        # cn 등 공유 유틸
  zod-config.ts                   # Zod 커스텀 에러 메시지 (한국어)
prisma/
  schema/                           # DB 스키마 (멀티파일)
    base.prisma                     # generator + datasource
    {model}.prisma                  # 도메인별 모델 (1파일 1도메인)
\```
```

---

## rules/recipe.md

```markdown
---
description: 새 기능 구현 시 파일 생성 순서 및 데이터 흐름 패턴
globs:
  - "components/**"
  - "hooks/**"
  - "server/**"
  - "lib/**"
  - "app/**"
  - "prisma/**"
---

# 기능 구현 레시피

새 기능 "{feature}" 구현 시 아래 순서를 따른다.

## 파일 생성 순서

1. `prisma/schema/{model}.prisma` — model 파일 생성 → `npx prisma migrate dev`
2. `lib/validations/{feature}.ts` — Zod 기본 스키마
3. `server/dto/{feature}.dto.ts` — Request/Response DTO (validations 스키마 재사용)
4. `server/services/{feature}.service.ts` — 비즈니스 로직 + DTO 검증
5. `server/controllers/{feature}.controller.ts` — HTTP 요청/응답 처리
6. `app/api/{feature}/route.ts` + `[id]/route.ts` — API Routes (Controller 위임)
7. `server/actions/{feature}.ts` — Server Actions (SSR 초기 데이터용, Service 위임)
8. `components/ui/` 확인 → 미설치 시 `pnpm dlx shadcn@latest add {컴포넌트}`
9. `components/{feature}/` — 컴포넌트 (역할별 접미사는 `patterns/components.md` 참조)
10. `hooks/use-{feature}.ts` — TanStack Query 훅 (fetch → API Routes)
11. `app/` — 페이지 (Server Component, Server Actions로 initialData 전달)

## 데이터 흐름

### SSR 초기 데이터 (서버 → 클라이언트)
- Page(Server Component) → Server Actions(read) → Service → Prisma
- initialData props로 Client Component에 전달
- Client Component에서 useQuery({ queryFn, initialData })로 관리

### CSR 클라이언트 요청 (클라이언트 → 서버)
- hooks에서 fetch("/api/{feature}") 호출 → API Route → Controller → Service → Prisma
- useMutation으로 쓰기 → onSuccess/onSettled에서 invalidateQueries
- 낙관적 업데이트: onMutate에서 캐시 수정, onError에서 롤백

### 계층 책임
- **Validations**: Zod 기본 스키마 정의
- **DTO**: Validations 스키마를 재사용하여 Request/Response 타입 생성
- **Service**: DTO로 입력 검증 + Prisma 쿼리 실행 (비즈니스 로직)
- **Controller**: HTTP 요청 파싱 + Service 호출 + API 응답 포맷
- **API Route**: HTTP 메서드별 Controller 위임 (얇은 래퍼)
- **Server Actions**: SSR용 Service 위임 (얇은 래퍼)
```

---

## rules/coding-standards.md

```markdown
---
description: 네이밍 컨벤션, 임포트 규칙, 금지 항목
---

# 코딩 표준

## 네이밍

- 파일: kebab-case (`todo-form.tsx`, `use-todos.ts`)
- 컴포넌트: PascalCase (`TodoForm`) / 함수·변수: camelCase (`getTodos`)
- 타입: PascalCase + 접미사 (`TodoItemProps`) / Zod: camelCase + Schema (`createTodoSchema`)
- 훅: camelCase use 접두사 (`useTodos`, `useCreateTodo`)

## 임포트

- 경로 별칭: `@/*` — 순서: 외부 라이브러리 → `@/` 내부
- 타입: `import type { ... }`
- 조건부 스타일: `import { cn } from "@/lib/utils"`

## 금지

- `enum` → 문자열 리터럴 유니온
- `any` → `unknown`
- `interface` → `type`
- `console.log` 남기지 않기
- PrismaClient 직접 생성 금지 → `@/server/db/prisma`
- 인라인 스타일 금지 → Tailwind (예외: DB 색상 등 동적 값)
- default export 금지 (pages/layouts 제외)
```

---

## rules/verification.md

```markdown
---
description: 작업 완료 후 필수 검증 체크리스트
---

# 작업 후 검증

## 필수 체크

- 코드 변경 후: `npx tsc --noEmit`
- 패키지 설치/변경 후: `npx prisma generate`
- 최종 검증: `pnpm build`

## 품질 셀프체크

코드 완성 전 확인:
- 모든 외부 입력에 Zod 검증이 있는가
- Server Actions에 try/catch 에러 처리가 있는가
- 임포트 경로가 기존 코드베이스 패턴과 일치하는가
```
