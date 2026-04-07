# Gap Analysis: project-structure-audit

## 분석 개요

| 항목 | 내용 |
|------|------|
| Design 문서 | `docs/02-design/features/project-structure-audit.design.md` |
| 분석일 | 2026-04-07 |
| Match Rate | **100%** (핵심 기준) / **91%** (엄밀 기준) |
| 검증 방법 | gap-detector agent |

---

## 항목별 분석 결과

| # | 항목 | 상태 | 상세 |
|---|------|:----:|------|
| T1-1 | Service 에러 로깅 (8곳) | Match | `[ServiceName.methodName]` 형식 4+4곳 적용 |
| T1-2 | Category DTO 스키마 재사용 | Match | `createCategoryDtoSchema = createCategorySchema` |
| T1-2(연쇄) | color 기본값 스키마 통일 | Match | `parsed.data.color` 직접 사용, 별도 기본값 제거 |
| T1-3 | Controller handleApiError | Match | todo/category 8곳 catch 블록 적용 |
| T1-4 | TodoFilterValue 타입명 | Match | 타입명 변경 + useState 타입 수정 |
| T1-5 | .env.example 생성 | Match | DATABASE_URL 템플릿 포함 |
| T1-6 | Response DTO 제거 | Match | 두 DTO 파일 모두 Request DTO만 유지 |
| T1-7 | ActionResult 공통 타입 | Match | types.ts 신규 + 두 파일 import 적용 |
| T2-1 | onDelete: SetNull | Match | todo.prisma 적용 + 마이그레이션 완료 |
| T2-2 | Category updatedAt | Match | category.prisma 적용 + 마이그레이션 완료 |
| T2-3 | error.tsx / not-found.tsx | Match | Design 코드와 정확히 일치 |
| T2-4 | useMemo 의존성 수정 | Match | filteredTodos useMemo 감싸기 + 의존성 배열 수정 |

---

## Minor Difference (1건)

| 항목 | Design | 구현 | 영향 |
|------|--------|------|------|
| category.dto.ts CreateCategoryDto | `z.infer<typeof ...>` | `z.input<typeof ...>` | Low |

**사유**: `createCategorySchema`의 color 필드가 `.optional().default("#6B7280")`이므로:
- `z.infer` (output 타입): `{ name: string; color: string }` — safeParse 결과
- `z.input` (input 타입): `{ name: string; color?: string }` — safeParse 입력

Service의 파라미터 타입으로는 `z.input`이 더 정확합니다 (safeParse 전 입력을 받으므로).
TypeScript 타입 체크 오류를 해결하기 위한 **의도적 개선**이므로 Gap이 아닌 Minor Difference로 분류합니다.

---

## 검증 결과

- `npx tsc --noEmit`: 통과
- `pnpm build`: 통과 (8/8 페이지 정상 생성)
- 마이그레이션: `20260407012321_update_category_model` 적용 완료
