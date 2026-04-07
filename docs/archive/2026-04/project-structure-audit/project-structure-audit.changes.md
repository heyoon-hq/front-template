# 변경 사항 상세 설명: project-structure-audit

> 프로젝트 구조 감사에서 발견된 보완사항과 수정 내용을 하나씩 설명합니다.

## 보완사항 전체 목록

### 보안 (내부망 기준 4건)

| # | 보완사항 | 심각도 | 수정 여부 |
|---|---------|:------:|:--------:|
| [S-01](#s-01-service에서-에러가-터지면-원본-에러가-사라져서-장애-원인을-추적할-수-없음) | Service에서 에러가 터지면 원본 에러가 사라져서 장애 원인을 추적할 수 없음 | High | ✅ |
| [S-02](#s-02-envexample-파일이-없어서-새-팀원이-필요한-환경변수를-모름) | `.env.example` 파일이 없어서 새 팀원이 필요한 환경변수를 모름 | Medium | ✅ |
| [S-03](#s-03-server-actions에서-입력-검증-방식이-메서드마다-다름) | Server Actions에서 입력 검증 방식이 메서드마다 다름 (일관성 부족) | Medium | ✅ |
| [S-04](#s-04-카테고리-삭제-시-관련-todo가-어떻게-되는지-db에-설정이-없음) | 카테고리 삭제 시 관련 Todo가 어떻게 되는지 DB에 설정이 없음 | Medium | ✅ |

### 구조 (11건)

| # | 보완사항 | 수정 여부 |
|---|---------|:--------:|
| [C-01](#c-01-category-dto가-원본-스키마를-재사용하지-않고-새로-정의--기본-색상값-3곳에서-불일치) | Category DTO가 원본 스키마를 재사용하지 않고 새로 정의 + 기본 색상값 3곳에서 불일치 | ✅ |
| [C-02](#c-02-handleapierror-유틸이-만들어져-있는데-아무-데서도-안-쓰고-controller에서-같은-코드-8번-반복) | `handleApiError` 유틸이 만들어져 있는데 아무 데서도 안 쓰고 Controller에서 같은 코드 8번 반복 | ✅ |
| [C-03](#c-03-todofilter라는-이름이-컴포넌트와-타입에서-동시에-쓰여서-혼란) | `TodoFilter`라는 이름이 컴포넌트와 타입에서 동시에 쓰여서 혼란 | ✅ |
| [C-04](#c-04-response-dto-스키마가-정의만-되고-어디에서도-사용되지-않음) | Response DTO 스키마가 정의만 되고 어디에서도 사용되지 않음 (미사용 코드) | ✅ |
| [C-05](#c-05-actionresult-타입이-todots와-categoryts-두-곳에-중복-정의) | `ActionResult` 타입이 todo.ts와 category.ts 두 곳에 중복 정의 | ✅ |
| [C-06](#c-06-usememo-의존성이-잘못되어-memoization이-매번-무효화됨) | `useMemo` 의존성이 잘못되어 memoization이 매번 무효화됨 | ✅ |
| [C-07](#c-07-category-모델에-updatedat-필드가-없음-todo에는-있음-규칙-위반) | Category 모델에 `updatedAt` 필드가 없음 (Todo에는 있음, 규칙 위반) | ✅ |
| [C-08](#c-08-errortsx--not-foundtsx가-없어서-에러-시-nextjs-기본-페이지-표시) | `error.tsx` / `not-found.tsx`가 없어서 에러 시 Next.js 기본 페이지 표시 | ✅ |
| [C-09](#c-09-백로그-todo-category-apiresponse-타입이-여러-파일에-중복-정의) | `Todo`, `Category`, `ApiResponse` 타입이 여러 파일에 중복 정의 | 백로그 |
| [C-10](#c-10-백로그-apppagetsx에-metadata-export가-없음) | `app/page.tsx`에 metadata export가 없음 | 백로그 |
| [C-11](#c-11-백로그-홈-페이지가-main-route-group-밖에-위치) | 홈 페이지가 `(main)` route group 밖에 위치 | 백로그 |

---

## S-01. Service에서 에러가 터지면 원본 에러가 사라져서 장애 원인을 추적할 수 없음

### 보완사항

데이터베이스 작업은 `Controller → Service → Prisma → PostgreSQL` 흐름으로 처리된다. DB 에러가 발생하면 Prisma가 상세한 에러를 던지는데(에러 코드, 어떤 필드에서 문제가 생겼는지 등), Service의 catch 블록에서 이 원본 에러를 **버리고** 새 에러를 만들어서 던지고 있었다.

서버 터미널에 아무것도 남지 않아서, 장애가 발생하면 원인이 DB 연결 실패인지, 유니크 제약 위반인지, 컬럼 누락인지 구분할 수 없었다.

### 이전 코드

```typescript
// server/services/category.service.ts
catch (error) {
  // error에는 Prisma 에러 원본이 들어있음
  // 예: PrismaClientKnownRequestError { code: 'P2002', target: ['name'] }
  // 하지만 여기서 완전히 사라짐

  throw new Error("이미 존재하는 카테고리입니다")
  // 새 에러만 위로 전달됨. 서버 터미널에 아무것도 안 찍힘.
}
```

DB가 죽었을 때도 "이미 존재하는 카테고리입니다"라는 엉뚱한 메시지가 나가고, 진짜 원인(DB 연결 실패)은 사라진다.

### 수정 내용

`console.error` 한 줄 추가. todo.service.ts 4곳 + category.service.ts 4곳 = 총 8곳.

```typescript
// server/services/category.service.ts (수정 후)
catch (error) {
  console.error("[CategoryService.create]", error)  // ← 추가
  throw new Error("이미 존재하는 카테고리입니다")
}
```

- `console.error`: 서버 터미널에만 출력됨 (클라이언트에 전달되지 않음)
- `[CategoryService.create]`: 어떤 서비스의 어떤 메서드에서 터졌는지 식별하는 접두사
- `error`: Prisma 에러 원본 전체 (에러 코드, 상세 메시지, 스택 트레이스)

접두사 목록:

```
[TodoService.findAll]     [CategoryService.findAll]
[TodoService.create]      [CategoryService.create]
[TodoService.update]      [CategoryService.update]
[TodoService.delete]      [CategoryService.delete]
```

### 수정 후 동작

```
서버 터미널 (개발자가 봄):
[CategoryService.create] PrismaClientKnownRequestError:
  Unique constraint failed on the constraint: `Category_name_key`
  code: 'P2002', meta: { target: ['name'] }

클라이언트 응답 (사용자가 봄 — 이전과 동일):
{ success: false, error: "이미 존재하는 카테고리입니다" }
```

### 수정 파일

- `server/services/todo.service.ts` — 4곳 catch 블록에 console.error 추가
- `server/services/category.service.ts` — 4곳 catch 블록에 console.error 추가

---

## S-02. `.env.example` 파일이 없어서 새 팀원이 필요한 환경변수를 모름

### 보완사항

프로젝트는 PostgreSQL에 연결하기 위해 `DATABASE_URL` 환경변수가 필요하다. `.env` 파일에 설정하는데, `.env`는 `.gitignore`에 포함되어 있어서 Git에 커밋되지 않는다 (비밀번호 같은 민감 정보가 들어있으니까).

새 팀원이 프로젝트를 클론하면 `.env` 파일이 없고, 어떤 환경변수를 어떤 형식으로 넣어야 하는지 알 수 없다. 다른 팀원한테 물어보거나 코드를 뒤져서 찾아야 한다.

### 수정 내용

`.env.example` 파일을 신규 생성했다. 이 파일은 `.gitignore`에 포함되지 않으므로 Git에 커밋된다.

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/my_app_db"
```

새 팀원의 온보딩 흐름:

```
git clone ...
cp .env.example .env    ← 복사해서 필요하면 값만 수정
pnpm install
pnpm dev
→ 정상 동작
```

`.env.example`은 "이 프로젝트에 어떤 환경변수가 필요한지"를 알려주는 문서 역할이다. 실제 `.env`와 달리 커밋해도 안전한 개발용 기본값을 넣어둔다.

### 수정 파일

- `.env.example` — 신규 생성

---

## S-03. Server Actions에서 입력 검증 방식이 메서드마다 다름

### 보완사항

Server Actions에 CRUD 함수가 있는데, 입력 검증 위치가 메서드마다 달랐다.

- `createTodo`, `updateTodo`: Actions에서 검증 없이 Service에 바로 넘김 → Service의 safeParse가 검증
- `deleteTodo`: Actions에서 safeParse로 먼저 검증 → Service에 검증된 데이터 넘김

같은 파일 안에서 패턴이 다르면 새 기능을 만들 때 "어떤 걸 따라야 하지?"라는 혼란이 생긴다. 동작에 문제는 없지만 일관성 부족.

### 수정 내용

이 항목은 별도로 코드를 수정하지 않았다. **C-01(Category DTO 스키마 재사용)** 수정의 결과로 간접 해결되었다.

이전에는 Category DTO가 원본 스키마와 다르게 정의되어 있어서 Service의 safeParse가 불완전한 검증(default 없음, 규칙 미동기화)을 하고 있었다. DTO를 원본 스키마 재사용으로 바꾸면서, Service의 safeParse가 validations에 정의된 모든 규칙(min, max, regex, default)을 정확히 적용하게 되었다.

create/update는 Service에서 검증, delete는 Actions에서 검증이라는 패턴 차이 자체는 남아있지만, 각 검증이 정확한 스키마를 사용하게 된 것이 핵심이다.

### 수정 파일

- 별도 수정 없음 (C-01에서 간접 해결)

---

## S-04. 카테고리 삭제 시 관련 Todo가 어떻게 되는지 DB에 설정이 없음

### 보완사항

Todo와 Category는 관계가 있다. Todo에 `categoryId` 필드가 있어서 "이 할 일은 '업무' 카테고리에 속해있다"를 표현한다.

문제는 카테고리를 삭제할 때다. "업무" 카테고리를 삭제하면, 이 카테고리에 속한 Todo들의 `categoryId`는 어떻게 되는가? 이 동작이 DB에 **명시적으로 설정되어 있지 않았다**.

### 이전 코드

```prisma
// prisma/schema/todo.prisma (이전)
category Category? @relation(fields: [categoryId], references: [id])
//                                                                 ↑ onDelete 설정 없음
```

`onDelete`를 안 쓰면 PostgreSQL 기본값인 **RESTRICT**가 적용된다. RESTRICT는 "관련 데이터가 있으면 삭제를 거부"하는 정책이다.

실제 동작:

```
DB 상태:
  Category: { id: "cat1", name: "업무" }
  Todo: { id: "t1", title: "보고서 작성", categoryId: "cat1" }
  Todo: { id: "t2", title: "회의 준비",   categoryId: "cat1" }

사용자: "업무" 카테고리 삭제 버튼 클릭

→ DELETE FROM "Category" WHERE id = 'cat1'
→ PostgreSQL: "안 됨! Todo 2개가 이 카테고리를 참조하고 있음"
→ Prisma 에러 throw
→ 사용자에게: "카테고리를 찾을 수 없습니다" ← 찾았는데 못 지운 건데 메시지도 맞지 않음
```

사용자 입장에서는 "삭제 버튼을 눌렀는데 에러가 나고, 이유를 모른다"는 상황이 된다.

### 수정 내용

```prisma
// prisma/schema/todo.prisma (수정 후)
category Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
//                                                                   ↑ 추가
```

`onDelete: SetNull`은 "부모(Category)가 삭제되면 자식(Todo)의 참조 필드를 null로 바꿔라"는 정책이다.

수정 후 동작:

```
DB 상태:
  Category: { id: "cat1", name: "업무" }
  Todo: { id: "t1", title: "보고서 작성", categoryId: "cat1" }
  Todo: { id: "t2", title: "회의 준비",   categoryId: "cat1" }

사용자: "업무" 카테고리 삭제 버튼 클릭

→ DELETE FROM "Category" WHERE id = 'cat1'
→ PostgreSQL이 자동으로:
   UPDATE "Todo" SET "categoryId" = NULL WHERE "categoryId" = 'cat1'
→ 결과:
  Todo: { id: "t1", title: "보고서 작성", categoryId: null }  ← "무소속"으로 변경
  Todo: { id: "t2", title: "회의 준비",   categoryId: null }  ← "무소속"으로 변경
→ 카테고리 삭제 성공, 할 일들은 사라지지 않고 "무소속"으로 표시
```

이 변경은 DB 스키마 변경이므로 마이그레이션이 필요했다. `prisma/migrations/20260407012321_update_category_model/migration.sql`에 다음 SQL이 포함되었다:

```sql
ALTER TABLE "Todo" DROP CONSTRAINT IF EXISTS "Todo_categoryId_fkey";
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
```

### 수정 파일

- `prisma/schema/todo.prisma` — `onDelete: SetNull` 추가
- `prisma/migrations/20260407012321_update_category_model/migration.sql` — 마이그레이션

---

## C-01. Category DTO가 원본 스키마를 재사용하지 않고 새로 정의 + 기본 색상값 3곳에서 불일치

### 보완사항

프로젝트에서 Zod 스키마를 정의하는 곳이 두 군데 있다:

- `lib/validations/category.ts` — 원본 스키마 (Single Source of Truth)
- `server/dto/category.dto.ts` — 원본을 재사용해야 하는 곳

그런데 DTO 파일이 원본을 import만 하고 실제로는 새로 정의하고 있었다. 게다가 기본 색상값이 3곳에서 제각각이었다:

| 위치 | 기본 색상 |
|------|-----------|
| `lib/validations/category.ts` (원본) | `#6B7280` (회색) |
| `server/dto/category.dto.ts` (DTO) | 없음 (default 누락) |
| `server/services/category.service.ts` (Service) | `#3b82f6` (파란색) |

Todo DTO는 `createTodoDtoSchema = createTodoSchema`로 올바르게 재사용하고 있었기 때문에, Category만 규칙을 위반하고 있는 상태.

### 이전 코드

```typescript
// server/dto/category.dto.ts (이전)
import { z } from "@/lib/zod-config"
import { createCategorySchema } from "@/lib/validations/category"
//       ↑ import했지만 아래에서 안 씀!

export const createCategoryDtoSchema = z.object({
  name: z.string().min(1, "카테고리 이름을 입력해주세요").max(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  //     ↑ .default("#6B7280")가 없음! 원본에는 있는데
})

// Response DTO도 있었음 (미사용 — C-04에서 다룸)
export const categoryResponseDtoSchema = z.object({ ... })
```

```typescript
// server/services/category.service.ts (이전)
color: parsed.data.color ?? "#3b82f6"
//                           ↑ 또 다른 기본값! 원본(#6B7280)과 다름
```

### 수정 내용

DTO에서 원본 스키마를 그대로 재사용하고, Service의 별도 기본값도 제거했다.

```typescript
// server/dto/category.dto.ts (수정 후)
import type { z } from "@/lib/zod-config"
import { createCategorySchema, updateCategorySchema } from "@/lib/validations/category"

export const createCategoryDtoSchema = createCategorySchema  // 원본 그대로 재사용
export type CreateCategoryDto = z.input<typeof createCategoryDtoSchema>
//                               ↑ z.infer가 아닌 z.input 사용 (아래 설명)
```

```typescript
// server/services/category.service.ts (수정 후)
color: parsed.data.color,
//     ↑ ?? "#3b82f6" 제거. safeParse가 default("#6B7280")를 적용하므로 항상 값이 있음
```

이제 기본 색상은 원본 한 곳(`#6B7280`)에서만 관리된다.

#### `z.input` vs `z.infer`를 왜 구분했나

`createCategorySchema`의 color는 `.optional().default("#6B7280")`이다. safeParse를 거치면 color가 항상 채워진다.

- `z.infer` (출력 타입): `{ name: string; color: string }` — safeParse 결과이므로 color 필수
- `z.input` (입력 타입): `{ name: string; color?: string }` — safeParse 전이므로 color 선택적

Service 파라미터는 safeParse에 넣는 데이터이므로 `z.input`이 정확하다. `z.infer`를 쓰면 `CategoryService.create({ name: "업무" })`에서 "color가 없다"는 TypeScript 에러가 발생한다.

#### `updateTodoSchema.omit({ id: true })`의 의미

DTO 파일에서 update 스키마도 재사용한다:

```typescript
export const updateTodoDtoSchema = updateTodoSchema.omit({ id: true })
```

`.omit({ id: true })`는 원본 스키마에서 `id` 필드만 빼고 나머지를 그대로 유지한다. API Route에서 id는 URL 경로(`/api/todos/abc123`)로 받고, body에는 수정할 데이터만 들어오기 때문이다.

나중에 원본에 `priority` 같은 필드를 추가하면, omit을 쓴 DTO에는 자동 반영된다. 새로 정의했으면 두 곳을 동시에 수정해야 하고, 빠뜨리면 버그가 된다.

#### `z.input` vs `z.infer` 상세 설명

`safeParse`는 데이터를 넣으면 검증하고, `default()`가 있으면 값을 채워서 내보내는 **변환기**다.

```
       ┌──── safeParse ────┐
넣는 것 │                   │ 나오는 것
(입력)  │  검증 + 변환       │ (출력)
       └───────────────────┘

예시 1: color를 안 넣음
입력: { name: "업무" }
       → safeParse: "color 없네? default가 #6B7280이니까 채워주자"
출력: { name: "업무", color: "#6B7280" }

예시 2: color를 넣음
입력: { name: "업무", color: "#FF0000" }
       → safeParse: "color 있네? 그대로 통과"
출력: { name: "업무", color: "#FF0000" }
```

넣는 것과 나오는 것의 형태가 다르다:

```
넣을 때: color가 있어도 되고 없어도 됨  → { name: string, color?: string }
나올 때: color가 항상 있음              → { name: string, color: string }
```

`z.infer`와 `z.input`은 각각 어느 쪽 타입인지를 의미한다:

```typescript
z.input<typeof createCategorySchema>
// = safeParse에 "넣는" 데이터의 타입
// = { name: string, color?: string }  ← 선택

z.infer<typeof createCategorySchema>
// = safeParse에서 "나오는" 데이터의 타입
// = { name: string, color: string }   ← 필수
```

Service 코드에서 보면:

```typescript
async create(data: CreateCategoryDto) {         // ← safeParse에 넣는 값 → z.input
  const parsed = createCategoryDtoSchema.safeParse(data)  // data를 넣음

  parsed.data.color   // ← safeParse에서 나온 값 → z.infer — color 항상 있음
}
```

만약 `z.infer`를 썼다면:

```typescript
export type CreateCategoryDto = z.infer<...>  // { name: string, color: string }

CategoryService.create({ name: "업무" })
//                                     ← color 안 넣음
// TypeScript 에러: "color가 필수인데 없잖아!"
```

`z.input`을 쓰면:

```typescript
export type CreateCategoryDto = z.input<...>  // { name: string, color?: string }

CategoryService.create({ name: "업무" })
//                                     ← color 안 넣음
// TypeScript: "OK! color는 선택이니까"
// safeParse 안에서: color = "#6B7280" 으로 채워짐
```

참고: `default()`가 없는 스키마(예: `createTodoSchema`)에서는 `z.infer`와 `z.input`이 동일하므로 어느 걸 써도 상관없다. **`default()`가 있을 때만** 둘이 달라진다.

### 수정 파일

- `server/dto/category.dto.ts` — 스키마 재사용 + `z.input` + Response DTO 제거
- `server/services/category.service.ts` — `?? "#3b82f6"` 기본값 제거

---

## C-02. `handleApiError` 유틸이 만들어져 있는데 아무 데서도 안 쓰고 Controller에서 같은 코드 8번 반복

### 보완사항

`lib/api/error-handler.ts`에 에러 처리 유틸 함수가 이미 존재했다:

```typescript
export function handleApiError(error: unknown, defaultMessage: string, status = 500) {
  const message = error instanceof Error ? error.message : defaultMessage
  return NextResponse.json(ApiResponse.error(message), { status })
}
```

이 함수가 하는 일:
- `error`가 Error 인스턴스면 → `error.message`를 응답 메시지로 사용
- Error가 아니면 → `defaultMessage`를 응답 메시지로 사용
- `{ success: false, error: "메시지" }` + HTTP 상태 코드로 JSON 응답 생성

그런데 이 함수를 아무 데서도 호출하지 않고, Controller 2개(Todo, Category) × 4메서드(getAll, create, update, delete) = **8곳에서 동일한 로직을 직접 작성**하고 있었다.

### 이전 코드

```typescript
// 이 6줄짜리 패턴이 8곳에서 반복됨
catch (error) {
  return NextResponse.json(
    ApiResponse.error(
      error instanceof Error ? error.message : "서버 오류"
    ),
    { status: 500 }
  )
}
```

### 수정 내용

```typescript
// 1줄로 교체
catch (error) {
  return handleApiError(error, "서버 오류", 500)
}
```

메서드별 매핑:

```
getAll:  handleApiError(error, "서버 오류", 500)  — 서버 문제 → 500
create:  handleApiError(error, "생성 실패", 400)  — 입력 문제 → 400
update:  handleApiError(error, "수정 실패", 404)  — 못 찾음 → 404
delete:  handleApiError(error, "삭제 실패", 404)  — 못 찾음 → 404
```

나중에 에러 응답 형식을 바꾸고 싶으면(예: timestamp 추가) `handleApiError` 함수 1곳만 수정하면 8곳 전부에 반영된다.

### 수정 파일

- `server/controllers/todo.controller.ts` — 4곳 catch 블록에서 handleApiError 사용
- `server/controllers/category.controller.ts` — 4곳 catch 블록에서 handleApiError 사용

---

## C-03. `TodoFilter`라는 이름이 컴포넌트와 타입에서 동시에 쓰여서 혼란

### 보완사항

`todo-filtered-list.tsx` 파일 안에서 `TodoFilter`라는 이름이 두 가지 용도로 쓰이고 있었다:

```typescript
import { TodoFilter } from "./todo-filter"            // ← React 컴포넌트
type TodoFilter = "all" | "active" | "completed"       // ← 타입
```

TypeScript에서 값(컴포넌트)과 타입은 별도 네임스페이스여서 같은 이름이어도 에러는 안 난다. 하지만 코드를 읽을 때 "이 `TodoFilter`는 컴포넌트인가 타입인가?" 혼란이 생긴다:

```typescript
const [filter, setFilter] = useState<TodoFilter>("all")   // ← 타입? 컴포넌트?
<TodoFilter current={filter} onChange={setFilter} />       // ← 컴포넌트? 타입?
```

### 수정 내용

타입 이름을 `TodoFilterValue`로 변경했다:

```typescript
import { TodoFilter } from "./todo-filter"              // 컴포넌트 — 그대로
type TodoFilterValue = "all" | "active" | "completed"    // 타입 — 이름 변경

const [filter, setFilter] = useState<TodoFilterValue>("all")  // 명확
<TodoFilter current={filter} onChange={setFilter} />           // 명확
```

이제 각 이름이 하나의 의미만 갖는다:
- `TodoFilter` = 필터 UI를 보여주는 컴포넌트
- `TodoFilterValue` = 필터 값의 종류를 나타내는 타입

### 수정 파일

- `components/todo/todo-filtered-list.tsx` — `type TodoFilter` → `type TodoFilterValue`, `useState<TodoFilterValue>`

---

## C-04. Response DTO 스키마가 정의만 되고 어디에서도 사용되지 않음

### 보완사항

`server/dto/todo.dto.ts`와 `server/dto/category.dto.ts`에 Response DTO가 정의되어 있었다:

```typescript
// server/dto/todo.dto.ts (이전)
export const todoResponseDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  categoryId: z.string().nullable(),
  dueDate: z.date().nullable(),
  createdAt: z.date(),
  category: z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
  }).nullable().optional(),
})
export type TodoResponseDto = z.infer<typeof todoResponseDtoSchema>
```

Response DTO의 원래 의도는 "API 응답 데이터를 검증"하는 것이다. 하지만 실제 Controller 코드를 보면:

```typescript
const todos = await TodoService.findAll()
return NextResponse.json(ApiResponse.success(todos))
//                                           ↑ Prisma 반환값을 그대로 넣음
//                                             todoResponseDtoSchema.parse() 같은 건 없음
```

프로젝트 전체를 검색해도 `todoResponseDtoSchema`를 `.parse()`나 `.safeParse()`하는 코드가 단 한 곳도 없었다. `categoryResponseDtoSchema`도 마찬가지.

정의만 있고 사용 안 하면 생기는 문제:
1. 실행되지 않는 코드가 거짓말을 할 수 있음 (예: 스키마에는 `z.date()`인데 실제 JSON 응답에서는 string으로 직렬화됨)
2. 모델에 필드를 추가하면 Response DTO도 업데이트해야 하지만, 안 쓰이니까 잊어버림
3. `import { z }`가 런타임 import로 남아있음 (번들에 포함)

### 수정 내용

Response DTO를 전부 삭제하고 Request DTO만 남겼다. `z` import도 `import type`으로 변경했다.

```typescript
// server/dto/todo.dto.ts (수정 후)
import type { z } from "@/lib/zod-config"       // type-only import (빌드에서 제거됨)
import { createTodoSchema, updateTodoSchema } from "@/lib/validations/todo"

export const createTodoDtoSchema = createTodoSchema
export type CreateTodoDto = z.infer<typeof createTodoDtoSchema>

export const updateTodoDtoSchema = updateTodoSchema.omit({ id: true })
export type UpdateTodoDto = z.infer<typeof updateTodoDtoSchema>

// Response DTO 전부 삭제됨
```

`import type`은 TypeScript 컴파일 후 완전히 제거된다. `z`를 런타임 코드(`z.object()` 등)에서 호출하지 않고 타입 추론(`z.infer`, `z.input`)에만 쓰므로 `import type`이 적절하다.

### 수정 파일

- `server/dto/todo.dto.ts` — Response DTO 삭제 + `import type`
- `server/dto/category.dto.ts` — Response DTO 삭제 + `import type`

---

## C-05. `ActionResult` 타입이 todo.ts와 category.ts 두 곳에 중복 정의

### 보완사항

Server Actions에서 CUD(Create/Update/Delete) 작업의 반환 타입으로 `ActionResult`를 사용한다. 이 타입이 `server/actions/todo.ts`와 `server/actions/category.ts` 두 파일에서 **각각 따로 정의**되어 있었다:

```typescript
// server/actions/todo.ts (이전)
type ActionResult = { success: true } | { success: false; error: string }

// server/actions/category.ts (이전)
type ActionResult = { success: true } | { success: false; error: string }
```

내용이 완전히 동일한데 두 곳에 복사되어 있었다.

동일 타입 중복 정의의 문제:
1. 나중에 한쪽을 수정하면(예: `timestamp` 필드 추가) 다른 쪽은 빠뜨릴 수 있음
2. 새 Actions 파일(예: `server/actions/comment.ts`)을 만들면 또 복사해야 함
3. "이 타입의 정의는 어디에 있는가?"에 대한 답이 하나가 아님

### 수정 내용

공통 타입 파일을 만들고 두 파일에서 import하도록 변경했다.

신규 파일:

```typescript
// server/actions/types.ts
export type ActionResult = { success: true } | { success: false; error: string }
```

기존 파일 수정:

```typescript
// server/actions/todo.ts (수정 후)
import type { ActionResult } from "@/server/actions/types"
// type ActionResult = ... 인라인 정의 삭제

// server/actions/category.ts (수정 후)
import type { ActionResult } from "@/server/actions/types"
// type ActionResult = ... 인라인 정의 삭제
```

이제 `ActionResult`의 정의는 `types.ts` 한 곳에만 있다. 나중에 새 Actions 파일을 만들면 같은 곳에서 import하면 된다.

### `ActionResult` 타입 설명

이 타입은 Discriminated Union(판별 유니온)이다:

```typescript
type ActionResult =
  | { success: true }                    // 성공: error 필드 없음
  | { success: false; error: string }    // 실패: error 필드 필수
```

`success` 값을 기준으로 TypeScript가 타입을 자동으로 좁혀준다:

```typescript
const result = await createTodo(formData)

if (result.success) {
  // TypeScript: result는 { success: true }
  // result.error  ← 접근 불가 (없는 필드)
} else {
  // TypeScript: result는 { success: false; error: string }
  console.log(result.error)  // ← 안전하게 접근 가능
}
```

### 수정 파일

- `server/actions/types.ts` — 신규 생성 (ActionResult 공통 타입)
- `server/actions/todo.ts` — 인라인 타입 삭제 + import 추가
- `server/actions/category.ts` — 인라인 타입 삭제 + import 추가

---

## C-06. `useMemo` 의존성이 잘못되어 memoization이 매번 무효화됨

### 보완사항

`todo-filtered-list.tsx`에서 할 일 목록을 필터링하고 날짜별로 그룹핑하는 로직이 있다. 그룹핑에는 `useMemo`를 써서 "데이터가 안 바뀌면 이전 결과를 재사용"하려 했다.

그런데 memoization이 **사실상 동작하지 않고 있었다**.

### `useMemo`가 뭘 하는 건가

`useMemo`는 "의존성 배열에 있는 값이 바뀌지 않으면 이전에 계산한 결과를 재사용하고, 바뀌면 다시 계산"하는 React 훅이다.

```typescript
const result = useMemo(() => {
  // 비싼 계산
  return 무거운계산(data)
}, [data])
// data가 안 바뀌면 → 이전 result 재사용 (계산 스킵)
// data가 바뀌면 → 다시 계산
```

핵심은 React가 의존성 값을 `===`(참조 비교)로 비교한다는 것이다.

### 이전 코드: 왜 memoization이 무효화되었나

```typescript
// 이전 코드
const filteredTodos = todos.filter((todo) => { ... })  // 매번 새 배열 생성

const groupedTodos = useMemo(() => {
  // 날짜별 그룹핑 (Map 구성, 배열 변환 등)
}, [filteredTodos])
//   ↑ 이게 문제!
```

`.filter()`는 **매번 새로운 배열 객체**를 반환한다. 내용이 같아도 다른 객체다:

```typescript
const a = [1, 2, 3]
const b = [1, 2, 3]
a === b  // false! — 내용은 같지만 메모리에서 다른 객체

const c = a
a === c  // true — 같은 객체를 가리킴
```

그래서 매 렌더마다:

```
렌더 1: filteredTodos = [todo1, todo2]  ← 배열 객체 A
렌더 2: filteredTodos = [todo1, todo2]  ← 배열 객체 B (내용 같지만 새 객체)

React가 비교: A === B → false → "바뀌었다!" → useMemo 재계산
→ 결국 매번 그룹핑을 다시 함 = useMemo를 쓴 의미가 없음
```

### 수정 내용

`filteredTodos`도 `useMemo`로 감싸서 **안정적 참조**를 만들었다:

```typescript
// 수정 후
const filteredTodos = useMemo(() =>
  todos.filter((todo) => {
    if (filter === "active" && todo.completed) return false
    if (filter === "completed" && !todo.completed) return false
    if (categoryFilter === "none" && todo.categoryId !== null) return false
    if (categoryFilter !== "all" && categoryFilter !== "none" && todo.categoryId !== categoryFilter) return false
    return true
  }),
  [todos, filter, categoryFilter]
  // ↑ 이 3개가 바뀌지 않으면 같은 배열 객체를 재사용
)

const groupedTodos = useMemo(() => {
  // 날짜별 그룹핑
}, [filteredTodos])
// ↑ filteredTodos가 안정적이므로 정상 memo 동작
```

### 수정 후 동작 시나리오

```
시나리오 1: 카테고리 필터 버튼 클릭 → setCategoryFilter("업무")
→ categoryFilter 변경됨
→ filteredTodos useMemo 재계산 (의존성 변경) ✓
→ groupedTodos useMemo 재계산 (filteredTodos 변경) ✓

시나리오 2: 할 일 체크박스 토글 → updateMutation
→ todos 배열 변경됨
→ filteredTodos useMemo 재계산 (의존성 변경) ✓
→ groupedTodos useMemo 재계산 (filteredTodos 변경) ✓

시나리오 3: 캘린더 팝오버 열기 → setCalendarOpen(true)
→ todos, filter, categoryFilter 모두 안 바뀜
→ filteredTodos useMemo: 이전 결과 재사용 ✓ (계산 스킵)
→ groupedTodos useMemo: 이전 결과 재사용 ✓ (계산 스킵)
```

시나리오 3이 핵심이다. 이전에는 필터/데이터와 무관한 state 변경에도 매번 필터링+그룹핑을 다시 했지만, 이제는 관련 데이터가 실제로 바뀔 때만 계산한다.

### 수정 파일

- `components/todo/todo-filtered-list.tsx` — `filteredTodos`를 `useMemo`로 감싸기 + 의존성 배열 `[todos, filter, categoryFilter]`

---

## C-07. Category 모델에 `updatedAt` 필드가 없음 (Todo에는 있음, 규칙 위반)

### 보완사항

Prisma 스키마 규칙(`prisma.md`)에서 모든 모델은 `createdAt`과 `updatedAt`을 필수 필드로 정의하고 있다:

```prisma
// prisma.md 규칙 — 필수 필드
model Example {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Todo 모델은 규칙을 따르고 있었다:

```prisma
// prisma/schema/todo.prisma — updatedAt 있음 ✅
model Todo {
  id        String   @id @default(cuid())
  // ... 필드들 ...
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt        // ← 있음
}
```

하지만 Category 모델은 `updatedAt`이 누락되어 있었다:

```prisma
// prisma/schema/category.prisma (이전) — updatedAt 없음 ❌
model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  color     String   @default("#6B7280")
  todos     Todo[]
  createdAt DateTime @default(now())
  // updatedAt 없음!
}
```

카테고리 이름이나 색상을 수정해도 "언제 수정했는지" 기록이 남지 않는다.

### 수정 내용

`updatedAt` 필드를 추가했다:

```prisma
// prisma/schema/category.prisma (수정 후)
model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  color     String   @default("#6B7280")
  todos     Todo[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt        // ← 추가
}
```

### `@updatedAt`이 하는 일

Prisma의 `@updatedAt`은 해당 행이 수정될 때마다 **자동으로 현재 시각을 기록**한다. 개발자가 직접 값을 넣을 필요가 없다:

```typescript
// 카테고리 생성 시
prisma.category.create({ data: { name: "업무" } })
// → createdAt: 2026-04-07T10:00:00Z
// → updatedAt: 2026-04-07T10:00:00Z  (생성 시점과 동일)

// 카테고리 색상 수정 시
prisma.category.update({ where: { id: "cat1" }, data: { color: "#FF0000" } })
// → createdAt: 2026-04-07T10:00:00Z  (변경 안 됨)
// → updatedAt: 2026-04-07T15:30:00Z  (자동으로 현재 시각)
```

### 마이그레이션 처리

DB에 이미 Category 데이터가 6개 있었기 때문에, 단순히 `NOT NULL` 컬럼을 추가하면 에러가 난다 (기존 행에 값이 없으니까). 마이그레이션 SQL에서 `DEFAULT CURRENT_TIMESTAMP`로 기존 행에 초기값을 넣었다:

```sql
ALTER TABLE "Category" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

이렇게 하면 기존 6개 Category의 updatedAt은 마이그레이션 실행 시점으로 설정되고, 이후 수정부터는 Prisma가 자동 관리한다.

### 수정 파일

- `prisma/schema/category.prisma` — `updatedAt DateTime @updatedAt` 추가
- `prisma/migrations/20260407012321_update_category_model/migration.sql` — 마이그레이션 (S-04의 onDelete 변경과 함께 처리)

---

## C-08. `error.tsx` / `not-found.tsx`가 없어서 에러 시 Next.js 기본 페이지 표시

### 보완사항

Next.js App Router에서는 **파일 이름이 곧 기능**이다. 특수 파일을 만들면 특정 상황에서 자동으로 렌더링된다:

| 파일 | 언제 렌더링되는가 |
|------|-------------------|
| `page.tsx` | 해당 경로에 접속했을 때 |
| `layout.tsx` | 하위 페이지들을 감싸는 레이아웃 |
| `error.tsx` | 해당 경로에서 **런타임 에러**가 발생했을 때 |
| `not-found.tsx` | **존재하지 않는 경로**에 접속했을 때 |
| `loading.tsx` | 페이지 로딩 중일 때 (Suspense 경계) |

이 프로젝트에는 `error.tsx`와 `not-found.tsx`가 없었다. 그래서:

- 서버 에러 발생 시: Next.js 기본 에러 페이지 (영문, 스타일 없음, "Application error: a server-side exception has occurred")
- `/asdfgh` 같은 없는 경로 접속 시: Next.js 기본 404 페이지 (영문, "404 | This page could not be found")

프로젝트는 한국어로 되어있는데 에러 페이지만 영문이고, 디자인도 프로젝트와 전혀 다른 스타일이 표시되는 상태.

### 수정 내용

두 개의 파일을 `app/` 디렉토리에 신규 생성했다. `app/` 루트에 두면 **모든 하위 경로**에 적용된다.

#### `app/error.tsx`

```typescript
"use client"  // ← error.tsx는 반드시 Client Component여야 함 (Next.js 규칙)

import { Button } from "@/components/ui/button"

type ErrorPageProps = {
  error: Error & { digest?: string }  // Next.js가 전달하는 에러 객체
  reset: () => void                    // 페이지를 다시 시도하는 함수
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">문제가 발생했습니다</h1>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={reset}>다시 시도</Button>
      </div>
    </div>
  )
}
```

`"use client"`가 필수인 이유: `error.tsx`는 React의 Error Boundary 위에서 동작한다. Error Boundary는 클라이언트에서만 동작하는 기능이므로 Client Component여야 한다.

`reset` 함수: Next.js가 제공하는 함수로, 호출하면 에러가 난 페이지를 다시 렌더링 시도한다. 일시적 오류(네트워크 불안정 등)일 때 사용자가 직접 재시도할 수 있다.

#### `app/not-found.tsx`

```typescript
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-muted-foreground">
          요청하신 페이지가 존재하지 않습니다.
        </p>
        <Button asChild>
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </div>
    </div>
  )
}
```

이 파일은 Server Component(기본값)이다. `error.tsx`와 달리 `"use client"` 없음. 404는 에러 복구가 필요 없고 단순히 "없는 페이지"를 안내하면 되니까 서버에서 렌더링해도 충분하다.

### 수정 후 동작

```
이전:
  /asdfgh 접속 → "404 | This page could not be found" (영문, Next.js 기본)
  서버 에러 발생 → "Application error: a server-side exception has occurred" (영문)

이후:
  /asdfgh 접속 → "페이지를 찾을 수 없습니다" + "홈으로 돌아가기" 버튼
  서버 에러 발생 → "문제가 발생했습니다" + 에러 메시지 + "다시 시도" 버튼
```

두 파일 모두 프로젝트의 기존 스타일 패턴(`flex min-h-screen items-center justify-center`, shadcn Button)을 따른다.

### 수정 파일

- `app/error.tsx` — 신규 생성 (에러 경계)
- `app/not-found.tsx` — 신규 생성 (404 페이지)

---

# 백로그 (수정하지 않은 항목 3건)

아래 3건은 발견했지만 **이번에 수정하지 않았다**. 아키텍처적 판단이 필요하거나, 현재 상태가 의도적일 수 있기 때문이다.

---

## C-09. (백로그) `Todo`, `Category`, `ApiResponse` 타입이 여러 파일에 중복 정의

### 무엇이 발견되었나

같은 타입이 여러 파일에서 각각 정의되어 있다.

**`Category` 타입 — 4곳에서 정의:**

```typescript
// hooks/use-categories.ts
type Category = {
  id: string
  name: string
  color: string
  createdAt: Date | string
}

// components/todo/todo-filtered-list.tsx — 같은 내용
type Category = { id: string; name: string; color: string; createdAt: Date | string }

// components/todo/todo-item.tsx — 같은 내용
type Category = { id: string; name: string; color: string; createdAt: Date | string }

// components/todo/todo-form.tsx — 같은 내용 (확인 필요)
```

**`Todo` 타입 — 3곳에서 정의:**

```typescript
// hooks/use-todos.ts
type Todo = { id: string; title: string; completed: boolean; ... }

// components/todo/todo-filtered-list.tsx — TodoWithCategory라는 이름으로 비슷한 내용
type TodoWithCategory = { id: string; title: string; completed: boolean; ... }
```

**`ApiResponse` / `ApiErrorResponse` — 2곳에서 정의:**

```typescript
// hooks/use-todos.ts
type ApiResponse<T> = { success: true; data: T }
type ApiErrorResponse = { success: false; error: string }

// hooks/use-categories.ts — 완전히 동일
type ApiResponse<T> = { success: true; data: T }
type ApiErrorResponse = { success: false; error: string }
```

참고로 `lib/api/response.ts`에도 `ApiResponse` 타입이 이미 정의되어 있지만, hooks에서는 이걸 import하지 않고 각자 정의하고 있다.

### 왜 수정하지 않았나

현재 프로젝트의 hooks 패턴 규칙(`.claude/rules/patterns/hooks.md`)에 이렇게 적혀있다:

> **타입 정의**: 훅 파일 내에서 필요한 타입을 직접 정의

이 규칙이 의도적으로 "파일별 독립성"을 선택한 것이다. 각 파일이 외부 타입에 의존하지 않으므로:
- 파일 하나만 보면 어떤 타입을 쓰는지 바로 알 수 있음
- 다른 파일의 타입 변경이 이 파일에 영향을 주지 않음

반면 타입을 중앙화하면:
- 한 곳에서 관리하므로 일관성 보장
- 하지만 중앙 타입 파일을 수정하면 여러 파일에 영향

**이 트레이드오프(파일 독립성 vs 타입 일관성)에 대한 결정이 필요**해서 백로그로 남겼다.

수정한다면 방법은:
1. `lib/types/` 같은 공유 타입 디렉토리 생성
2. 또는 Prisma 모델 타입(`import type { Todo } from "@prisma/client"`) 활용
3. hooks 패턴 규칙도 함께 업데이트

---

## C-10. (백로그) `app/page.tsx`에 metadata export가 없음

### 무엇이 발견되었나

프로젝트의 page 패턴 규칙(`.claude/rules/patterns/page.md`)에서:

> `export const metadata: Metadata` — 필수

다른 페이지들은 규칙을 따르고 있다:

```typescript
// app/(main)/todos/page.tsx — metadata 있음 ✅
export const metadata: Metadata = {
  title: "할일 관리 | My App",
  description: "Todo 목록을 관리하세요",
}

// app/(main)/categories/page.tsx — metadata 있음 ✅
export const metadata: Metadata = {
  title: "카테고리 관리 | My App",
  description: "카테고리를 관리하세요",
}
```

하지만 홈 페이지(`app/page.tsx`)에는 metadata가 없다:

```typescript
// app/page.tsx — metadata 없음 ❌
export default async function Home() {
  // ... 바로 컴포넌트 시작
}
```

### 왜 수정하지 않았나

`app/layout.tsx`(Root Layout)에 이미 metadata가 정의되어 있다:

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: "My App",
  description: "Next.js + Prisma + PostgreSQL starter template",
}
```

Next.js에서 페이지에 metadata가 없으면 **상위 layout의 metadata를 상속**한다. 홈 페이지의 제목이 "My App"이면 Root Layout과 동일하므로 별도로 정의할 필요가 없다.

물론 규칙 문서에 "필수"라고 적혀있으므로 형식적으로는 위반이다. 하지만 기능적 문제가 전혀 없고, 중복 코드를 만드는 것도 좋지 않아서 백로그로 남겼다.

수정한다면:

```typescript
// app/page.tsx에 추가
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My App",           // Root Layout과 동일
  description: "할일과 카테고리를 관리하세요",  // 좀 더 구체적으로
}
```

---

## C-11. (백로그) 홈 페이지가 `(main)` route group 밖에 위치

### 무엇이 발견되었나

프로젝트의 라우트 구조:

```
app/
  layout.tsx          ← Root Layout (Providers 래핑)
  page.tsx            ← 홈 페이지 (여기!)
  (main)/
    layout.tsx        ← Main Layout (MainNav 네비게이션 포함)
    todos/page.tsx    ← 할일 페이지
    categories/page.tsx ← 카테고리 페이지
```

`(main)` route group 안에 있는 페이지들(`/todos`, `/categories`)은 `MainNav` 네비게이션이 표시된다. 하지만 홈 페이지(`/`)는 `(main)` 밖에 있으므로 **네비게이션이 없다**.

실제 동작:

```
/ (홈)         → MainNav 없음. 독자적인 레이아웃
/todos         → MainNav 있음 (Home, Todos, Categories 링크)
/categories    → MainNav 있음
```

### 왜 수정하지 않았나

이것은 **의도적 설계**일 가능성이 높다:

1. 홈 페이지는 카테고리 폼 + 할일 폼 + 할일 목록을 한 화면에 모아놓은 "대시보드" 스타일이다
2. `/todos`와 `/categories`는 각 기능에 집중하는 "상세" 페이지다
3. 홈에서 "전체 보기 →" 버튼으로 각 상세 페이지로 이동할 수 있다

홈 페이지의 독자적인 레이아웃이 의도적 UX 결정이라면 바꿀 이유가 없다. 반대로 홈에도 네비게이션이 필요하다면 `(main)` 안으로 옮기면 된다.

이것은 "맞다/틀리다"가 아니라 **UX 판단**의 영역이므로 백로그로 남겼다.
