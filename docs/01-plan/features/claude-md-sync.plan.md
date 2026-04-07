# Plan: CLAUDE.md 규칙-프로젝트 구조 정합성 확인

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | CLAUDE.md 규칙 파일들이 실제 프로젝트 구조와 불일치하여, 새 기능 개발 시 AI가 잘못된 패턴으로 코드를 생성할 위험이 있음 |
| **해결** | 규칙 파일들을 실제 프로젝트 구조에 맞게 업데이트하거나, 프로젝트 코드를 규칙에 맞게 리팩터링 |
| **기능 UX 효과** | 규칙과 실제가 일치하면 AI가 일관된 패턴으로 코드를 생성하여 개발 속도와 품질이 향상됨 |
| **핵심 가치** | 규칙-현실 동기화로 AI 협업의 신뢰성과 예측 가능성 확보 |

---

## 1. 갭 분석 결과

### GAP-01: 데이터 흐름 아키텍처 불일치 (심각도: Critical)

**규칙이 말하는 것:**
- CLAUDE.md: "읽기: Page → Server Actions(read) → initialData → useQuery"
- CLAUDE.md: "쓰기: useMutation → Server Actions → invalidateQueries"
- hooks.md (line 19-20): "queryFn/mutationFn에 Server Actions 직접 전달", "/api/ 라우트 별도 생성하지 않음"

**실제 프로젝트:**
- Page에서 Server Actions 호출 → initialData 전달 (규칙과 일치)
- 하지만 hooks는 `fetch("/api/todos")`로 **API Route를 호출** (규칙과 불일치)
- `app/api/todos/`, `app/api/categories/` API Route가 존재 (규칙에서 언급 없음)

**혼선 시나리오:** 새 기능 개발 시 AI가 hooks.md 규칙을 따라 Server Actions를 직접 호출하는 훅을 만들면, 기존 코드(API Route 방식)와 패턴이 달라짐.

---

### GAP-02: server/ 디렉토리 구조 미문서화 (심각도: High)

**규칙 (structure.md):**
```
server/
  actions/{feature}.ts    # Server Actions (CRUD)
  db/prisma.ts            # DB 싱글턴
```

**실제 프로젝트:**
```
server/
  actions/                # Server Actions ✅
  controllers/            # API Route 핸들러 (미문서화)
    todo.controller.ts
    category.controller.ts
  services/               # 비즈니스 로직 계층 (미문서화)
    todo.service.ts
    category.service.ts
  dto/                    # Data Transfer Objects + Zod (미문서화)
    todo.dto.ts
    category.dto.ts
  db/prisma.ts            # DB 싱글턴 ✅
```

**혼선 시나리오:** AI가 structure.md를 보고 Server Actions에 직접 Prisma 쿼리를 작성하지만, 실제로는 Service 계층을 통해야 함.

---

### GAP-03: lib/ 디렉토리 구조 미문서화 (심각도: Medium)

**규칙 (structure.md):**
```
lib/
  validations/{feature}.ts   # Zod 스키마
  utils.ts                   # cn 등 공유 유틸
```

**실제 프로젝트:**
```
lib/
  validations/               # Zod 스키마 ✅
  api/                       # API 응답 포맷 (미문서화)
    response.ts
    error-handler.ts
  utils.ts                   # cn 함수 ✅
  zod-config.ts              # Zod 한국어 설정 (미문서화)
```

---

### GAP-04: app/ 디렉토리 API Route 미문서화 (심각도: High)

**규칙 (structure.md):** `app/api/` 관련 내용 없음

**실제 프로젝트:**
```
app/api/
  todos/
    route.ts           # GET, POST
    [id]/route.ts      # PATCH, DELETE
  categories/
    route.ts           # GET, POST
    [id]/route.ts      # PATCH, DELETE
```

hooks.md가 "API 라우트 별도 생성하지 않음"이라고 명시하지만, 실제로는 API Route가 존재하고 hooks가 이를 호출함.

---

### GAP-05: Server Actions Zod 검증 불일치 (심각도: Medium)

**규칙 (server-actions.md):** 모든 CUD 함수에서 Zod safeParse 사용 예시

**실제 코드:**
- `deleteTodo`: safeParse 사용 ✅
- `createTodo`: safeParse **미사용**, Service 계층에 위임
- `updateTodo`: safeParse **미사용**, Service 계층에 위임

---

### GAP-06: 타입 추론 패턴 불일치 (심각도: Low)

**규칙 (hooks.md):**
```typescript
type Foo = Awaited<ReturnType<typeof getFoos>>[number]
```

**실제 코드 (use-todos.ts):** 수동으로 `type Todo = { ... }` 인라인 정의

---

### GAP-07: recipe.md 구현 순서와 실제 아키텍처 불일치 (심각도: High)

**규칙 (recipe.md) 파일 생성 순서:**
1. prisma schema → 2. validations → 3. server/actions → 4~7. components, hooks, pages

**실제 프로젝트 아키텍처:**
1. prisma schema → 2. validations + dto → 3. services → 4. controllers → 5. server/actions → 6. API routes → 7. components, hooks, pages

recipe.md에는 dto, services, controllers, API routes 단계가 빠져있음.

---

## 2. 갭 요약 매트릭스

| ID | 갭 내용 | 심각도 | 영향 범위 |
|----|---------|--------|-----------|
| GAP-01 | 데이터 흐름 (Server Actions vs API Routes) | Critical | hooks/, app/api/ |
| GAP-02 | server/ 구조 미문서화 (controllers, services, dto) | High | server/ 전체 |
| GAP-03 | lib/ 구조 미문서화 (api/, zod-config) | Medium | lib/ |
| GAP-04 | app/api/ Route 미문서화 | High | app/api/ |
| GAP-05 | Server Actions Zod 검증 불일치 | Medium | server/actions/ |
| GAP-06 | 타입 추론 패턴 불일치 | Low | hooks/ |
| GAP-07 | recipe.md 구현 순서 누락 | High | 전체 개발 흐름 |

---

## 3. 해결 방향 선택지

### 옵션 A: 규칙을 실제 프로젝트에 맞게 업데이트
- structure.md에 controllers/, services/, dto/, api/ 추가
- hooks.md의 데이터 흐름을 API Route 방식으로 수정
- recipe.md에 dto, services, controllers, API routes 단계 추가
- 새 패턴 파일 추가: `patterns/api-routes.md`, `patterns/services.md`

### 옵션 B: 프로젝트를 규칙에 맞게 리팩터링
- API Routes 제거, hooks에서 Server Actions 직접 호출로 변경
- controllers, services, dto 계층 제거, Server Actions에 통합
- 더 단순한 구조지만 기존 코드 대량 변경 필요

### 옵션 C: 하이브리드 (권장)
- 현재 프로젝트 아키텍처(계층 분리)는 유지 (옵션 A 기반)
- 단, 명확하게 두 가지 데이터 흐름 경로를 문서화:
  - SSR 초기 데이터: Page → Server Actions → initialData
  - CSR 클라이언트 요청: hooks → API Routes → controllers → services

---

## 4. 수정 대상 파일 목록

| 파일 | 수정 내용 |
|------|-----------|
| `CLAUDE.md` | 데이터 흐름 설명 수정 (API Route 경로 추가) |
| `.claude/rules/structure.md` | server/, lib/, app/api/ 구조 추가 |
| `.claude/rules/recipe.md` | 구현 순서에 dto, services, controllers, API routes 추가 |
| `.claude/rules/patterns/hooks.md` | API Route 호출 방식으로 수정, Server Actions 직접 호출 설명 제거 |
| `.claude/rules/patterns/server-actions.md` | Service 계층 위임 패턴 반영 |
| (신규) `.claude/rules/patterns/api-routes.md` | API Route 패턴 문서화 |
| (신규) `.claude/rules/patterns/services.md` | Service 계층 패턴 문서화 |
