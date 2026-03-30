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
