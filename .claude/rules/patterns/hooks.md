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

## API Route 연동
- queryFn/mutationFn에서 `fetch("/api/{feature}")` 호출
- Server Actions 직접 호출하지 않음 (SSR initialData 전달은 Page에서 담당)
- 응답 타입: `ApiResponse<T>` (`{ success: true, data: T }`)

## initialData 패턴
```
Page (Server Component) → Server Action 호출 → props로 전달
  → Client Component → useQuery({ queryFn: fetch("/api/..."), initialData })
```

## invalidation 체인
- 연관 쿼리 함께 무효화 (예: todo 삭제 → `["categories"]` invalidate)
- onSettled에서 invalidate (성공/실패 모두)

## 타입 정의
- 훅 파일 내에서 필요한 타입을 직접 정의
- API 응답 타입도 함께 정의

```typescript
type Todo = {
  id: string
  title: string
  completed: boolean
  // ...
}

type ApiResponse<T> = {
  success: true
  data: T
}

type ApiErrorResponse = {
  success: false
  error: string
}
```

## 코드 예시

```typescript
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

type Foo = {
  id: string
  title: string
  createdAt: Date | string
}

type ApiResponse<T> = { success: true; data: T }
type ApiErrorResponse = { success: false; error: string }

// Read — fetch + initialData로 SSR 데이터 활용
export function useFoos(initialData?: Foo[]) {
  return useQuery({
    queryKey: ["foos"],
    queryFn: async () => {
      const res = await fetch("/api/foos")
      if (!res.ok) throw new Error("Failed to fetch foos")
      const json: ApiResponse<Foo[]> = await res.json()
      return json.data
    },
    initialData,
  })
}

// Create — JSON body + invalidation
export function useCreateFoo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { title: string }) => {
      const res = await fetch("/api/foos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json: ApiResponse<Foo> | ApiErrorResponse = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foos"] })
    },
  })
}

// Update — 낙관적 업데이트 (즉시 UI 반영 + 에러 시 롤백)
export function useUpdateFoo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { id: string; title?: string }) => {
      const { id, ...updateData } = data
      const res = await fetch(`/api/foos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })
      const json: ApiResponse<Foo> | ApiErrorResponse = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
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
    mutationFn: async (data: { id: string }) => {
      const res = await fetch(`/api/foos/${data.id}`, {
        method: "DELETE",
      })
      const json: ApiResponse<null> | ApiErrorResponse = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
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
