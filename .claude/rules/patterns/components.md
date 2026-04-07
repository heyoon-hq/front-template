---
paths:
  - "components/**"
---

# 컴포넌트 패턴

## 접미사별 역할

| 접미사 | S/C | 역할 | 생성 조건 |
|--------|:---:|------|-----------|
| `-form` | Client | 입력 → mutation 훅으로 create/update | 생성/수정 기능 있으면 |
| `-item` | Client | 개별 항목 CRUD 상호작용 | 목록 + 수정/삭제 있으면 |
| `-list` | S/C | 목록 표시. 필터 있으면 `-filtered-list` | 목록 있으면 |
| `-filter`, `-select` | Client | 제어 컴포넌트 (value+onChange, 자체 state 없음) | 필터/선택 UI 있으면 |
| `-badge`, `-header`, `-status` | Server | 순수 표시 (props만으로 렌더링) | 라벨/상태 표시 필요 시 |
| `-effect` | Client | 애니메이션/피드백 (trigger 기반) | 시각적 피드백 필요 시 |

## Server/Client 판단
- useState, useEffect, onClick, useQuery 필요 → `"use client"`
- props만 받아서 렌더링 → Server Component (기본)
- 데이터 fetch (async function) → Server Component

## shadcn/ui 필수 사용
- raw HTML 폼 요소 금지 (`<button>`, `<input>`, `<select>`, `<textarea>`)
- HTML → shadcn 매핑:
  - `<button>` → `Button` (`@/components/ui/button`)
  - `<input>` → `Input` (`@/components/ui/input`)
  - `<input type="checkbox">` → `Checkbox` (`@/components/ui/checkbox`)
  - `<select>` → `Select + SelectTrigger + SelectContent + SelectItem`
  - `<input type="date">` → `Popover + Calendar + Button` 조합
  - 카드 레이아웃 → `Card + CardHeader + CardContent`
  - 배지/태그 → `Badge`
- 설치된 컴포넌트: Button, Input, Checkbox, Badge, Card, Select, Popover, Calendar
- 미설치 시: `pnpm dlx shadcn@latest add {컴포넌트}`

## 데이터 흐름
- Page에서 Server Actions(read) 호출 → initialData props로 전달
- Form/Item에서 mutation 훅 사용 (`useCreateFoo`, `useUpdateFoo`, `useDeleteFoo`)
- 부모→자식 콜백: `on{Event}` props (예: `onComplete`)
- initialData → useQuery로 CSR 관리, mutation → invalidateQueries로 캐시 갱신

## 핵심 예시: Form

```typescript
"use client"

import { useRef } from "react"
import { useCreateFoo } from "@/hooks/use-foos"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type FooFormProps = {
  // 참조 데이터 (예: categories)
}

export function FooForm({}: FooFormProps) {
  const createMutation = useCreateFoo()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    const title = formData.get("title") as string
    if (!title) return

    createMutation.mutate(
      { title },
      {
        onSuccess: () => {
          formRef.current?.reset()
        },
      }
    )
  }

  return (
    <form ref={formRef} action={handleSubmit}>
      <Input type="text" name="title" placeholder="입력..." />
      <Button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? "..." : "추가"}
      </Button>
      {createMutation.error && (
        <p className="text-sm text-destructive">{createMutation.error.message}</p>
      )}
    </form>
  )
}
```

## 레퍼런스 (나머지 패턴은 실제 파일 참조)
- Form: `components/todo/todo-form.tsx`
- Item: `components/todo/todo-item.tsx`
- Container: `components/todo/todo-filtered-list.tsx`
- Control: `components/todo/todo-filter.tsx`
- Display: `components/todo/date-group-header.tsx`
