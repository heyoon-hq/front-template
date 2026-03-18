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
- UI: shadcn/ui — 서버 상태: TanStack Query + Server Actions
- **읽기**: Page → Server Actions(read) → initialData props → useQuery
- **쓰기**: useMutation → Server Actions → invalidateQueries
- Zod safeParse로 Server Actions 입력 검증

## 개발 명령어
```bash
docker compose up -d          # PostgreSQL 시작 (필수 선행)
pnpm install                  # 의존성 설치
npx prisma migrate dev        # DB 마이그레이션
pnpm dev                      # 개발 서버 (http://localhost:3000)
pnpm build                    # 빌드
pnpm lint                     # 린트
npx tsc --noEmit              # 타입 체크
```

## 폴더 구조
```
app/                              # 라우팅 + 페이지
  providers.tsx                   # QueryClientProvider
  layout.tsx                      # Providers 래핑
  (main)/                         # Route Group (도메인별 페이지)
    layout.tsx                    # 공통 네비게이션
    {domain}/page.tsx             # 도메인 페이지
components/
  ui/                             # shadcn/ui (자동 생성, 직접 수정 지양)
  layout/                         # 공통 레이아웃 컴포넌트
  {feature}/                      # 기능별 컴포넌트
hooks/                            # TanStack Query 훅
  use-{feature}.ts                # useQuery + useMutation
server/
  actions/{feature}.ts            # Server Actions (CRUD)
  db/prisma.ts                    # DB 싱글턴 (수정 금지)
lib/
  validations/{feature}.ts        # Zod 스키마
  utils.ts                        # cn 등 공유 유틸
prisma/
  schema/                           # DB 스키마 (멀티파일)
    base.prisma                     # generator + datasource
    {model}.prisma                  # 도메인별 모델 (1파일 1도메인)
```

## IMPORTANT: 기능 구현 레시피

새 기능 "{feature}" 구현 시 아래 순서를 따른다.

### 파일 생성 순서
1. `prisma/schema/{model}.prisma` — model 파일 생성 → `npx prisma migrate dev`
2. `lib/validations/{feature}.ts` — Zod 스키마
3. `server/actions/{feature}.ts` — Server Actions (read + CRUD)
4. `components/ui/` 확인 → 미설치 시 `pnpm dlx shadcn@latest add {컴포넌트}`
5. `components/{feature}/` — 컴포넌트 (역할별 접미사는 `.claude/rules/components.md` 참조)
6. `hooks/use-{feature}.ts` — TanStack Query 훅
7. `app/` — 페이지 (Server Component, fetch + initialData 전달)

### 데이터 흐름
- Page에서 read 함수 호출 → initialData props로 전달
- Client Component에서 useQuery({ queryFn, initialData })로 관리
- useMutation으로 쓰기 → onSuccess/onSettled에서 invalidateQueries
- 낙관적 업데이트: onMutate에서 캐시 수정, onError에서 롤백

## 코드 패턴

경로별 패턴: `.claude/rules/patterns/` (해당 경로 작업 시 자동 로드)

요약:
- Page: `patterns/page.md` (페이지 타이틀 + 컨테이너)
- Server Actions: `server/actions/todo.ts` (ActionResult + safeParse)
- Validation: `lib/validations/todo.ts` (z.object + safeParse + 한국어 메시지)
- TanStack Query: `hooks/use-todos.ts` (useQuery + useMutation + 낙관적 업데이트)

## 코딩 표준

### 네이밍
- 파일: kebab-case (`todo-form.tsx`, `use-todos.ts`)
- 컴포넌트: PascalCase (`TodoForm`) / 함수·변수: camelCase (`getTodos`)
- 타입: PascalCase + 접미사 (`TodoItemProps`) / Zod: camelCase + Schema (`createTodoSchema`)
- 훅: camelCase use 접두사 (`useTodos`, `useCreateTodo`)

### 임포트
- 경로 별칭: `@/*` — 순서: 외부 라이브러리 → `@/` 내부
- 타입: `import type { ... }` / Zod: `import { z } from "zod/v4"`
- 조건부 스타일: `import { cn } from "@/lib/utils"`

### UI
- shadcn/ui 필수 사용 (https://ui.shadcn.com/docs/components), raw HTML 폼 요소 금지
- 설치된 컴포넌트: Button, Input, Checkbox, Badge, Card, Select, Popover, Calendar

### 금지
- `enum` → 문자열 리터럴 유니온 / `any` → `unknown` / `interface` → `type`
- `console.log` 남기지 않기 / PrismaClient 직접 생성 금지 → `@/server/db/prisma`
- 인라인 스타일 금지 → Tailwind (예외: DB 색상 등 동적 값)
- default export 금지 (pages/layouts 제외)

## 작업 후 검증

### 필수 체크
- 코드 변경 후: `npx tsc --noEmit`
- 패키지 설치/변경 후: `npx prisma generate`
- 최종 검증: `pnpm build`

### 품질 셀프체크
코드 완성 전 확인:
- 모든 외부 입력에 Zod 검증이 있는가
- Server Actions에 try/catch 에러 처리가 있는가
- 임포트 경로가 기존 코드베이스 패턴과 일치하는가
