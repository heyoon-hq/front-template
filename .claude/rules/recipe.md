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
2. `lib/validations/{feature}.ts` — Zod 스키마
3. `server/actions/{feature}.ts` — Server Actions (read + CRUD)
4. `components/ui/` 확인 → 미설치 시 `pnpm dlx shadcn@latest add {컴포넌트}`
5. `components/{feature}/` — 컴포넌트 (역할별 접미사는 `patterns/components.md` 참조)
6. `hooks/use-{feature}.ts` — TanStack Query 훅
7. `app/` — 페이지 (Server Component, fetch + initialData 전달)

## 데이터 흐름

- Page에서 read 함수 호출 → initialData props로 전달
- Client Component에서 useQuery({ queryFn, initialData })로 관리
- useMutation으로 쓰기 → onSuccess/onSettled에서 invalidateQueries
- 낙관적 업데이트: onMutate에서 캐시 수정, onError에서 롤백
