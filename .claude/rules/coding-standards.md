---
description: 코딩 표준 - 네이밍, 임포트, 금지 항목
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
