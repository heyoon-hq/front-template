# Plan: 프로젝트 구조 감사 및 보완

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | project-structure-audit |
| 작성일 | 2026-03-31 |
| 배포 환경 | **내부망** (사내 인트라넷, 인터넷 연결 O, 외부 접근 X) |
| 품질 점수 | 82/100 |
| 보완 이슈 | 보안 4건 (내부망 기준) + 구조 11건 = **15건** |

### Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | 규칙-코드 불일치 11건, 내부망 환경에서도 필요한 보안 기본 장치 4건 미비 |
| **Solution** | 코드 품질 일관성 회복 + 내부 운영에 필수적인 에러 로깅/데이터 무결성 보완 |
| **Function UX Effect** | 규칙과 코드가 일치하여 새 기능 확장 시 혼란 없음, 장애 발생 시 원인 추적 가능 |
| **Core Value** | 내부 사용자를 위한 안정적이고 일관된 스타터 템플릿 |

---

## 1. 운영 환경 정의

| 항목 | 상태 |
|------|------|
| 네트워크 | 사내 내부망 (인터넷 연결 O, 외부 접근 X) |
| 사용자 | 사내 직원 (신뢰된 사용자) |
| 외부 공격자 접근 | 불가 (방화벽/VPN으로 차단) |
| 위협 모델 | 내부 사용자 실수, 데이터 무결성, 운영 안정성 중심 |

### 내부망 기준 위협 재평가

| 이전 이슈 | 이전 심각도 | 내부망 심각도 | 사유 |
|-----------|:----------:|:----------:|------|
| 인증/인가 부재 | Critical | **해당없음** | 내부 사용자만 접근, 템플릿 범위 밖 |
| Docker 평문 비밀번호 | Critical | **Info** | 내부 개발 환경, 외부 노출 없음 |
| 보안 헤더 미설정 | High | **Info** | 외부 접근 불가, 클릭재킹/MIME 스니핑 위험 극히 낮음 |
| Rate Limiting 부재 | High | **해당없음** | 내부 사용자만 접근, 악의적 DoS 가능성 거의 없음 |
| CSRF 미적용 | High | **Low** | 직원이 악성 외부 사이트 방문 시 이론적 위험 있으나 내부망 특성상 낮음 |
| `.env.example` 부재 | High | **Medium** | DX 이슈이므로 환경 무관하게 필요 |
| 에러 메시지 유출 | Medium | **Low** | 내부 사용자에게 노출, 정보 유출 위험 낮음 |
| Content-Type 미검증 | Medium | **Info** | 내부 사용자가 악의적 요청 가능성 거의 없음 |
| 입력 검증 불일치 | Medium | **Medium** | 코드 일관성 이슈, 환경 무관 |
| FormData 타입 단언 | Medium | **Low** | 코드 품질 이슈, Service에서 Zod 검증됨 |
| **에러 로깅 부재** | Medium | **High ↑** | 내부 운영 시 장애 원인 추적이 핵심. 원본 에러 소실은 운영 안정성 직접 저해 |

---

## 2. 내부망 기준 보안 분석

### 내부망에서 여전히 중요한 항목 (4건)

#### S-01. 에러 로깅 부재 — 원본 에러 소실 [High]
- **위치**: Service 계층 전체 (`server/services/*.ts`)
- **문제**: `catch (error) { throw new Error("할 일을 생성할 수 없습니다") }` — Prisma 에러 원본 손실
- **내부망 영향**: 장애 발생 시 DB 연결 실패인지, 유니크 제약 위반인지, 쿼리 오류인지 원인 추적 불가
- **수정**: 원본 에러를 `console.error`로 서버 로그에 남기고, 클라이언트에는 사용자 메시지만 전달

#### S-02. `.env.example` 부재 + 환경변수 관리 [Medium]
- **위치**: 프로젝트 루트
- **문제**: 새 팀원 온보딩 시 필요 환경변수를 파악하기 어려움
- **수정**: `.env.example` 생성

#### S-03. Server Actions 입력 검증 불일치 [Medium]
- **위치**: `server/actions/todo.ts:12-30`
- **문제**: `deleteTodo`는 Actions에서 safeParse, `createTodo`/`updateTodo`는 Service에만 위임 — 일관성 부족
- **내부망 영향**: 의도치 않은 잘못된 입력이 Service까지 도달하여 불명확한 에러 발생 가능

#### S-04. Prisma 관계 `onDelete` 미설정 [Medium]
- **위치**: `prisma/schema/todo.prisma:7`
- **문제**: 카테고리 삭제 시 관련 Todo의 categoryId가 dangling reference 가능
- **내부망 영향**: 사용자가 카테고리 삭제 시 DB 에러 발생, UX 저하

### 내부망에서 수용 가능한 항목 (이전 이슈 → 제외)

| 항목 | 제외 사유 |
|------|-----------|
| 인증/인가 부재 | 내부 직원만 접근, 템플릿에서 인증은 범위 밖 |
| Rate Limiting | 내부 사용자 악의적 DoS 위험 없음 |
| 보안 헤더 (HSTS, CSP 등) | 외부 접근 불가, 내부망에서 실효성 낮음 |
| Docker 평문 비밀번호 | 내부 개발 환경, 프로덕션 배포 시 별도 관리 |
| CSRF | SameSite 쿠키 기본 정책으로 충분, 내부 사용자 위험 극히 낮음 |
| Content-Type 미검증 | 내부 사용자가 악의적 요청 전송 가능성 거의 없음 |

---

## 3. 구조 분석 (11건)

### P1: 높은 우선순위 — 규칙-코드 불일치

#### C-01. Category DTO 스키마 미재사용
- **위치**: `server/dto/category.dto.ts:8-11`
- **문제**: `createCategorySchema`를 import하지만 재사용 않고 새로 정의. `default("#6B7280")` 누락으로 동작 차이
- **규칙 위반**: DTO 규칙 — "기본 스키마 그대로 또는 `.omit()` 등으로 변환"

#### C-02. `handleApiError` 유틸 미사용
- **위치**: `lib/api/error-handler.ts` — 정의만 존재, 호출부 없음
- **문제**: Controller에서 동일한 에러 처리 패턴을 8번 반복 (4메서드 x 2 Controller)

#### C-03. `TodoFilter` 타입명 충돌
- **위치**: `components/todo/todo-filtered-list.tsx:18`
- **문제**: import한 `TodoFilter` 컴포넌트와 `type TodoFilter`가 동일 이름

### P2: 중간 우선순위 — 미사용 코드/누락

#### C-04. Response DTO 미사용
- **위치**: `server/dto/todo.dto.ts:12-28`, `category.dto.ts:18-24`
- **문제**: `todoResponseDtoSchema`, `categoryResponseDtoSchema` 정의만 있고 어디서도 미사용

#### C-05. `ActionResult` 타입 중복
- **위치**: `server/actions/todo.ts:6`, `server/actions/category.ts:6` — 동일 타입 2곳 정의

#### C-06. `useMemo` 의존성 문제
- **위치**: `components/todo/todo-filtered-list.tsx:57-71`
- **문제**: `filteredTodos`가 매 렌더마다 새 배열 → memoization 무효화

#### C-07. Category `updatedAt` 필드 누락
- **위치**: `prisma/schema/category.prisma`
- **규칙 참고**: prisma.md 필수 필드에 `updatedAt DateTime @updatedAt` 포함

#### C-08. `error.tsx` / `not-found.tsx` 누락
- **문제**: App Router 에러 경계 없음, 에러 시 Next.js 기본 페이지 표시

### P3: 낮은 우선순위 — 개선 권장

#### C-09. 타입 중복 (Todo 3곳, Category 4곳, ApiResponse 2곳)
- **현재 규칙**: hooks 패턴이 "훅 파일 내 직접 정의"를 허용
- **판단**: 규칙 자체 재검토 필요, 현행 유지도 가능

#### C-10. `app/page.tsx` metadata 미 export
- **상태**: Root layout metadata 상속으로 기능 문제 없음

#### C-11. `app/page.tsx`가 `(main)` route group 밖 위치
- **상태**: 의도적 설계일 수 있음 (홈은 별도 레이아웃)

---

## 4. 수정 계획 (내부망 기준 우선순위)

### Tier 1: 즉시 수정 (운영 안정성 + 규칙 일관성)

| # | 항목 | 파일 | 이슈 | 난이도 |
|---|------|------|------|--------|
| 1 | Service 에러 로깅 추가 | `server/services/*.ts` | S-01 | Trivial |
| 2 | Category DTO 스키마 재사용 | `server/dto/category.dto.ts` | C-01 | Trivial |
| 3 | `handleApiError` 활용 또는 제거 | Controllers / `error-handler.ts` | C-02 | Trivial |
| 4 | `TodoFilter` 타입명 충돌 해소 | `todo-filtered-list.tsx` | C-03 | Trivial |
| 5 | `.env.example` 생성 | `.env.example` | S-02 | Trivial |
| 6 | Response DTO 활용 또는 제거 | `server/dto/*.dto.ts` | C-04 | Trivial |
| 7 | `ActionResult` 타입 통합 | `server/actions/` | C-05 | Trivial |

### Tier 2: 릴리스 전 수정 (데이터 무결성 + UX)

| # | 항목 | 파일 | 이슈 | 난이도 |
|---|------|------|------|--------|
| 8 | Category `onDelete: SetNull` | `prisma/schema/todo.prisma` | S-04 | Moderate |
| 9 | Category `updatedAt` 추가 | `prisma/schema/category.prisma` | C-07 | Moderate |
| 10 | `error.tsx` / `not-found.tsx` 추가 | `app/` | C-08 | Moderate |
| 11 | `useMemo` 의존성 수정 | `todo-filtered-list.tsx` | C-06 | Trivial |

### Tier 3: 백로그 (검토 후 결정)

| # | 항목 | 비고 | 이슈 |
|---|------|------|------|
| 12 | 타입 중앙화 vs 파일별 독립 | 규칙 재검토 필요 | C-09 |
| 13 | 홈 페이지 metadata / route group | 의도 확인 필요 | C-10, C-11 |

---

## 5. 정상 확인 항목

### 구조

| 항목 | 점수 |
|------|------|
| 아키텍처 일관성 (계층 분리) | 95/100 |
| 데이터 흐름 패턴 (SSR/CSR) | 95/100 |
| 코딩 표준 준수 (금지 항목) | 90/100 |
| 네이밍/파일 구조 | 100/100 |

### 보안 (내부망 기준 양호)

| 항목 | 상태 | 비고 |
|------|------|------|
| SQL Injection | 양호 | Prisma ORM 파라미터화 쿼리 |
| XSS | 양호 | React 기본 이스케이핑, dangerouslySetInnerHTML 미사용 |
| IDOR | 양호 | cuid() 비순차 ID |
| SSRF | 양호 | 외부 URL 요청 패턴 없음 |
| CORS | 양호 | Next.js 기본 same-origin |
| 민감 정보 노출 | 양호 | NEXT_PUBLIC_ 환경변수 미사용, .env gitignore 적용 |
| 컴포넌트 취약점 | 양호 | 최신 패키지 (Next.js 16, React 19, Zod v4) |
