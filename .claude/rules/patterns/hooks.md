---
paths:
  - "hooks/**"
---

# TanStack Query 훅 패턴

## 규칙
- `"use client"` 필수
- 파일명: `use-{feature}.ts` (kebab-case, 복수형: `use-todos.ts`)
- 한 파일에 해당 feature의 모든 훅 포함

## queryKey 컨벤션
- 기본: `["{feature}"]` (복수형, 예: `["todos"]`, `["categories"]`)
- 상세: `["{feature}", { id }]` (개별 항목)
- 무한 스크롤: `["{feature}", "infinite"]`

## Server Actions 연동
- queryFn/mutationFn에 Server Actions 직접 전달
- `/api/` 라우트 별도 생성하지 않음

## initialData 패턴
```
Page (Server Component) → Server Action 호출 → props로 전달
  → Client Component → useQuery({ queryFn, initialData })
```

## invalidation 체인
- 연관 쿼리 함께 무효화 (예: todo 삭제 → `["categories"]` invalidate)
- onSettled에서 invalidate (성공/실패 모두)

## 타입 추론
```typescript
type Foo = Awaited<ReturnType<typeof getFoos>>[number]
```

## 코드 예시

```typescript
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getFoos, createFoo, updateFoo, deleteFoo } from "@/server/actions/foo"

type Foo = Awaited<ReturnType<typeof getFoos>>[number]

// Read — initialData로 SSR 데이터 활용
export function useFoos(initialData?: Foo[]) {
  return useQuery({
    queryKey: ["foos"],
    queryFn: () => getFoos(),
    initialData,
  })
}

// Create — 생성 후 목록 갱신
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

// Update — 낙관적 업데이트 (즉시 UI 반영 + 에러 시 롤백)
export function useUpdateFoo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof updateFoo>[0]) => updateFoo(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["foos"] })
      const previous = queryClient.getQueryData<Foo[]>(["foos"])

      queryClient.setQueryData<Foo[]>(["foos"], (old) =>
        old?.map((item) => {
          if (item.id !== newData.id) return item
          return { ...item, ...newData }
        })
      )

      return { previous }
    },
    onError: (_err, _newData, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["foos"], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["foos"] })
    },
  })
}

// Delete — 낙관적 삭제 (즉시 목록에서 제거)
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
      if (context?.previous) {
        queryClient.setQueryData(["foos"], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["foos"] })
    },
  })
}
```

## 레퍼런스
- `hooks/use-todos.ts`
- `hooks/use-categories.ts`

