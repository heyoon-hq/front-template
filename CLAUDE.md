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
```bash
docker compose up -d          # PostgreSQL 시작 (필수 선행)
pnpm install                  # 의존성 설치
npx prisma migrate dev        # DB 마이그레이션
pnpm dev                      # 개발 서버 (http://localhost:3000)
pnpm build                    # 빌드
pnpm lint                     # 린트
npx tsc --noEmit              # 타입 체크
```

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
