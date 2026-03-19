# Next.js + Prisma Full-Stack Skill

> Next.js 16 (App Router) + Prisma 6 + PostgreSQL 기반 올인원 풀스택 프로젝트의 셋업, 아키텍처, 개발 패턴을 정의한다.

---

## 1. 프로젝트 셋업

### 1.1 기술 스택 및 패키지 버전

| 카테고리 | 패키지 | 버전 |
|----------|--------|------|
| 프레임워크 | next | 16.1.6 |
| UI 런타임 | react, react-dom | 19.2.3 |
| 언어 | typescript | ^5 |
| ORM | prisma, @prisma/client | ^6.19.2 |
| 검증 | zod | ^4.3.6 |
| 서버 상태 | @tanstack/react-query | ^5.90.21 |
| UI 컴포넌트 | radix-ui | ^1.4.3 |
| 아이콘 | lucide-react | ^0.577.0 |
| 스타일링 | tailwindcss, @tailwindcss/postcss | ^4 |
| CSS 유틸 | class-variance-authority | ^0.7.1 |
| CSS 유틸 | clsx | ^2.1.1 |
| CSS 유틸 | tailwind-merge | ^3.5.0 |
| CSS 애니메이션 | tw-animate-css | ^1.4.0 |
| 날짜 | date-fns | ^4.1.0 |
| 날짜 피커 | react-day-picker | ^9.14.0 |
| shadcn CLI | shadcn (devDep) | ^3.8.5 |
| 환경변수 | dotenv (devDep) | ^17.3.1 |
| 린트 | eslint, eslint-config-next (devDep) | ^9, 16.1.6 |
| 패키지 매니저 | pnpm | latest |

### 1.2 설정 파일

#### package.json scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "postinstall": "prisma generate"
  },
  "pnpm": {
    "onlyBuiltDependencies": ["@prisma/client", "@prisma/engines", "prisma"]
  }
}
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"],
  "exclude": ["node_modules"]
}
```

#### next.config.ts
```typescript
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
```

#### postcss.config.mjs
```javascript
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};
export default config;
```

#### eslint.config.mjs
```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
export default eslintConfig;
```

#### components.json (shadcn/ui)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

#### docker-compose.yml
```yaml
services:
  db:
    image: postgres:16-alpine
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: my_app_db
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

#### .env (생성 필요)
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/my_app_db?schema=public"
```

### 1.3 기반 코드 (boilerplate)

#### app/globals.css
Tailwind CSS v4 + shadcn 테마. oklch 색상 시스템, 다크모드 CSS 변수 포함.
```css
@import "tailwindcss";
@import "../node_modules/tw-animate-css/dist/tw-animate.css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  /* ... shadcn 테마 변수 전체 매핑 */
}

/* :root (라이트) / .dark (다크) 색상 정의 — oklch 기반 */
```

#### app/layout.tsx
```typescript
import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "My App",
  description: "Next.js + Prisma + PostgreSQL starter template",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="dark">
      <body className="font-mono antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

#### app/providers.tsx
```typescript
"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

type ProvidersProps = { children: React.ReactNode }

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, refetchOnWindowFocus: true },
        },
      })
  )
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

#### app/(main)/layout.tsx
```typescript
import { MainNav } from "@/components/layout/main-nav"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container py-6">{children}</main>
    </div>
  )
}
```

#### server/db/prisma.ts (수정 금지)
```typescript
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

#### lib/utils.ts
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

#### prisma/schema/base.prisma
```prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 1.4 셋업 실행 순서

```bash
# 1. 프로젝트 생성 & 패키지 설치
pnpm install

# 2. DB 시작
docker compose up -d

# 3. .env 생성 (DATABASE_URL)

# 4. shadcn 기본 컴포넌트 설치
pnpm dlx shadcn@latest add button input checkbox badge card select popover calendar

# 5. Prisma 마이그레이션
npx prisma migrate dev --name init

# 6. 개발 서버
pnpm dev
```

---

## 2. 아키텍처

### 2.1 디렉토리 구조

```
app/                              # 라우팅 + 페이지
  globals.css                     # Tailwind + shadcn 테마
  layout.tsx                      # RootLayout (Providers 래핑)
  providers.tsx                   # QueryClientProvider
  (main)/                         # Route Group
    layout.tsx                    # MainNav + container
    {domain}/page.tsx             # 도메인별 페이지
components/
  ui/                             # shadcn/ui (자동 생성, 직접 수정 지양)
  layout/                         # 공통 레이아웃 (MainNav 등)
  {feature}/                      # 기능별 컴포넌트
hooks/
  use-{feature}.ts                # TanStack Query 훅 (useQuery + useMutation)
server/
  actions/{feature}.ts            # Server Actions (CRUD)
  db/prisma.ts                    # PrismaClient 싱글턴 (수정 금지)
lib/
  validations/{feature}.ts        # Zod 스키마
  utils.ts                        # cn() 등 공유 유틸
prisma/
  schema/                         # 멀티파일 스키마
    base.prisma                   # generator + datasource
    {model}.prisma                # 도메인별 모델 (1파일 1도메인)
```

### 2.2 데이터 흐름

```
[읽기]
Page (Server Component)
  → Server Actions (read) — Prisma 직접 반환
    → initialData props로 Client Component에 전달
      → useQuery({ queryFn, initialData })

[쓰기]
Client Component
  → useMutation({ mutationFn: serverAction })
    → Server Actions (create/update/delete) — ActionResult 반환
      → onSuccess/onSettled → invalidateQueries
```

- `/api/` 라우트 별도 생성하지 않음 — Server Actions가 API 역할
- 캐시 갱신은 TanStack Query의 `invalidateQueries`가 담당 (`revalidatePath` 미사용)

---

## 3. 기능 구현 레시피

새 기능 `{feature}`를 구현할 때 아래 순서를 따른다.

### Step 1 — Prisma 모델

파일: `prisma/schema/{model}.prisma`

```prisma
model Foo {
  id        String   @id @default(cuid())
  title     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

규칙:
- 모델명: PascalCase 단수형 (`Todo`, `Category`)
- 필드명: camelCase (`createdAt`, `dueDate`)
- 필수 필드: `id` (cuid), `createdAt`, `updatedAt`
- `enum` 사용 금지 → String + Zod 검증으로 대체
- 관계: `@relation` 명시적 선언, `onDelete` 설정
- 파일 간 모델 참조 시 import 불필요 (Prisma 자동 해석)

실행: `npx prisma migrate dev --name add-foo`

### Step 2 — Zod 검증 + Server Actions

#### 검증 스키마: `lib/validations/{feature}.ts`

```typescript
import { z } from "zod/v4"

// Create: 모든 필드 필수, 상세 한국어 에러 메시지
export const createFooSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200, "200자 이내로 입력해주세요"),
})

// Update: id 필수 + 나머지 optional
export const updateFooSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
})

// Delete: id만
export const deleteFooSchema = z.object({
  id: z.string(),
})

export type CreateFooInput = z.infer<typeof createFooSchema>
export type UpdateFooInput = z.infer<typeof updateFooSchema>
```

규칙:
- `import { z } from "zod/v4"` (v4 전용 경로)
- 스키마명: camelCase + Schema (`createFooSchema`)
- 타입명: PascalCase + Input (`CreateFooInput`)
- 에러 메시지: 한국어

#### Server Actions: `server/actions/{feature}.ts`

```typescript
"use server"

import { prisma } from "@/server/db/prisma"
import { createFooSchema, updateFooSchema, deleteFooSchema } from "@/lib/validations/foo"

type ActionResult = { success: true } | { success: false; error: string }

// Read — Prisma 직접 반환 (ActionResult 미사용)
export async function getFoos() {
  return prisma.foo.findMany({ orderBy: { createdAt: "desc" } })
}

// Create — FormData + safeParse
export async function createFoo(formData: FormData): Promise<ActionResult> {
  const parsed = createFooSchema.safeParse({ title: formData.get("title") })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  try {
    await prisma.foo.create({ data: { title: parsed.data.title } })
    return { success: true }
  } catch {
    return { success: false, error: "생성할 수 없습니다" }
  }
}

// Update — 구조체 파라미터
export async function updateFoo(data: { id: string; title?: string }): Promise<ActionResult> {
  const parsed = updateFooSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  try {
    const { id, ...updateData } = parsed.data
    await prisma.foo.update({ where: { id }, data: updateData })
    return { success: true }
  } catch {
    return { success: false, error: "수정할 수 없습니다" }
  }
}

// Delete
export async function deleteFoo(data: { id: string }): Promise<ActionResult> {
  const parsed = deleteFooSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  try {
    await prisma.foo.delete({ where: { id: parsed.data.id } })
    return { success: true }
  } catch {
    return { success: false, error: "삭제할 수 없습니다" }
  }
}
```

규칙:
- `"use server"` 파일 최상단 필수
- Read → Prisma 직접 반환 / CUD → `Promise<ActionResult>`
- 모든 입력에 `safeParse` 검증
- try/catch 필수, 한국어 에러 메시지
- `revalidatePath` 사용하지 않음 (TanStack Query가 캐시 관리)

### Step 3 — 컴포넌트

디렉토리: `components/{feature}/`

#### 접미사별 역할

| 접미사 | S/C | 역할 | 예시 |
|--------|:---:|------|------|
| `-form` | Client | 입력 → create/update Action | `FooForm` |
| `-item` | Client | 개별 항목 CRUD 상호작용 | `FooItem` |
| `-list` | S/C | 목록 표시 | `FooList`, `FooFilteredList` |
| `-filter`, `-select` | Client | 제어 컴포넌트 (value+onChange) | `FooFilter` |
| `-badge`, `-header`, `-status` | Server | 순수 표시 (props only) | `FooStatusBadge` |

#### Server/Client 판단
- `useState`, `useEffect`, `onClick`, `useQuery` → `"use client"`
- props만 받아서 렌더링 → Server Component (기본)

#### shadcn/ui 필수 사용
raw HTML 폼 요소 금지. 매핑:
- `<button>` → `Button` / `<input>` → `Input` / `<input type="checkbox">` → `Checkbox`
- `<select>` → `Select + SelectTrigger + SelectContent + SelectItem`
- `<input type="date">` → `Popover + Calendar + Button` 조합
- 카드 레이아웃 → `Card + CardHeader + CardContent`
- 배지/태그 → `Badge`
- 미설치 시: `pnpm dlx shadcn@latest add {컴포넌트}`

#### Form 예시

```typescript
"use client"

import { useRef, useState } from "react"
import { createFoo } from "@/server/actions/foo"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type FooFormProps = {
  // 참조 데이터 props
}

export function FooForm({}: FooFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createFoo(formData)
    if (result.success) {
      formRef.current?.reset()
    } else {
      setError(result.error)
    }
  }

  return (
    <form ref={formRef} action={handleSubmit}>
      <Input type="text" name="title" placeholder="입력..." />
      <Button type="submit">추가</Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
```

### Step 4 — TanStack Query 훅

파일: `hooks/use-{feature}.ts` (복수형: `use-foos.ts`)

```typescript
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getFoos, createFoo, updateFoo, deleteFoo } from "@/server/actions/foo"

type Foo = Awaited<ReturnType<typeof getFoos>>[number]

// Read — initialData로 SSR 활용
export function useFoos(initialData?: Foo[]) {
  return useQuery({
    queryKey: ["foos"],
    queryFn: () => getFoos(),
    initialData,
  })
}

// Create
export function useCreateFoo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => createFoo(formData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["foos"] })
      }
    },
  })
}

// Update — 낙관적 업데이트
export function useUpdateFoo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof updateFoo>[0]) => updateFoo(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["foos"] })
      const previous = queryClient.getQueryData<Foo[]>(["foos"])
      queryClient.setQueryData<Foo[]>(["foos"], (old) =>
        old?.map((item) => (item.id !== newData.id ? item : { ...item, ...newData }))
      )
      return { previous }
    },
    onError: (_err, _newData, context) => {
      if (context?.previous) queryClient.setQueryData(["foos"], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["foos"] })
    },
  })
}

// Delete — 낙관적 삭제
export function useDeleteFoo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string }) => deleteFoo(data),
    onMutate: async (deletedData) => {
      await queryClient.cancelQueries({ queryKey: ["foos"] })
      const previous = queryClient.getQueryData<Foo[]>(["foos"])
      queryClient.setQueryData<Foo[]>(["foos"], (old) =>
        old?.filter((item) => item.id !== deletedData.id)
      )
      return { previous }
    },
    onError: (_err, _newData, context) => {
      if (context?.previous) queryClient.setQueryData(["foos"], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["foos"] })
    },
  })
}
```

규칙:
- `"use client"` 필수
- 한 파일에 해당 feature의 모든 훅 포함
- queryKey: `["{feature}"]` (복수형) / 상세: `["{feature}", { id }]`
- queryFn/mutationFn에 Server Actions 직접 전달
- 타입 추론: `Awaited<ReturnType<typeof getAction>>[number]`
- 낙관적 업데이트: `onMutate` → 캐시 수정, `onError` → 롤백, `onSettled` → invalidate
- 연관 쿼리 함께 무효화 (예: todo 삭제 시 `["categories"]`도 invalidate)

### Step 5 — 페이지

파일: `app/(main)/{feature}/page.tsx`

```tsx
import type { Metadata } from "next"
import { getFoos } from "@/server/actions/foo"
import { FooForm } from "@/components/foo/foo-form"
import { FooFilteredList } from "@/components/foo/foo-filtered-list"

export const metadata: Metadata = {
  title: "Foo 관리 | My App",
  description: "Foo를 관리하세요",
}

export default async function FooPage() {
  const foos = await getFoos()

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Foo 관리</h1>
        </div>

        <FooForm />

        <div className="rounded-lg border bg-card p-4">
          <FooFilteredList initialData={foos} />
        </div>
      </div>
    </div>
  )
}
```

규칙:
- `export const metadata` 필수 (title, description)
- `export default async function` — Server Component
- 페이지는 **조립만** 담당: 데이터 fetch → 컴포넌트 배치 → initialData 전달
- 비즈니스 로직, 상태 관리, 이벤트 핸들러 금지
- 여러 데이터 페칭 시 `Promise.all` 사용
- 스타일: 래퍼 `flex min-h-screen items-start justify-center px-4 py-8` / 컨테이너 `w-full max-w-2xl space-y-6` / 타이틀 `text-2xl font-bold tracking-tight`

---

## 4. 코딩 표준

### 4.1 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 파일 | kebab-case | `todo-form.tsx`, `use-todos.ts` |
| 컴포넌트 | PascalCase | `TodoForm`, `TodoFilteredList` |
| 함수/변수 | camelCase | `getTodos`, `createTodo` |
| 타입 | PascalCase + 접미사 | `TodoItemProps`, `CreateTodoInput` |
| Zod 스키마 | camelCase + Schema | `createTodoSchema` |
| 훅 | camelCase use 접두사 | `useTodos`, `useCreateTodo` |
| Prisma 모델 | PascalCase 단수형 | `Todo`, `Category` |
| Prisma 필드 | camelCase | `createdAt`, `categoryId` |
| queryKey | 복수형 문자열 배열 | `["todos"]`, `["categories"]` |

### 4.2 임포트

```typescript
// 순서: 외부 라이브러리 → @/ 내부
import { useQuery } from "@tanstack/react-query"
import { getTodos } from "@/server/actions/todo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// 타입 임포트
import type { Metadata } from "next"
import type { Todo } from "@prisma/client"

// Zod v4 전용 경로
import { z } from "zod/v4"
```

- 경로 별칭: `@/*` (프로젝트 루트 기준)
- 타입만 import 시: `import type { ... }`

### 4.3 금지 사항

| 금지 | 대안 |
|------|------|
| `enum` | 문자열 리터럴 유니온 (`"active" \| "done"`) |
| `any` | `unknown` |
| `interface` | `type` |
| `console.log` 남기기 | 제거 |
| PrismaClient 직접 생성 | `import { prisma } from "@/server/db/prisma"` |
| 인라인 스타일 | Tailwind (예외: DB 색상 등 동적 값) |
| default export | 금지 (pages/layouts 제외) |
| raw HTML 폼 요소 | shadcn/ui 컴포넌트 사용 |
| `/api/` 라우트 생성 | Server Actions 사용 |
| `revalidatePath` | TanStack Query `invalidateQueries` |

---

## 5. 검증

### 코드 변경 후
```bash
npx tsc --noEmit          # 타입 체크
```

### 패키지 설치/변경 후
```bash
npx prisma generate       # Prisma 클라이언트 재생성
```

### 최종 검증
```bash
pnpm build                # 프로덕션 빌드
```

### 품질 셀프체크
- [ ] 모든 외부 입력에 Zod `safeParse` 검증이 있는가
- [ ] Server Actions에 try/catch 에러 처리가 있는가
- [ ] 임포트 경로가 `@/*` 별칭 패턴과 일치하는가
- [ ] shadcn/ui 컴포넌트를 사용했는가 (raw HTML 폼 요소 없는가)
- [ ] `"use client"` / `"use server"` 지시어가 올바른가
