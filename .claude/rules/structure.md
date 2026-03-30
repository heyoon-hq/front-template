---
description: 프로젝트 폴더 구조 및 파일 배치 규칙
alwaysApply: true
---

# 폴더 구조

```
app/                              # 라우팅 + 페이지
  providers.tsx                   # QueryClientProvider
  layout.tsx                      # Providers 래핑
  (main)/                         # Route Group (도메인별 페이지)
    layout.tsx                    # 공통 네비게이션
    {domain}/page.tsx             # 도메인 페이지
components/
  ui/                             # shadcn/ui (자동 생성, 직접 수정 지양)
  layout/                         # 공통 레이아웃 컴포넌트
  {feature}/                      # 기능별 컴포넌트
hooks/                            # TanStack Query 훅
  use-{feature}.ts                # useQuery + useMutation
server/
  actions/{feature}.ts            # Server Actions (CRUD)
  db/prisma.ts                    # DB 싱글턴 (수정 금지)
lib/
  validations/{feature}.ts        # Zod 스키마
  utils.ts                        # cn 등 공유 유틸
prisma/
  schema/                           # DB 스키마 (멀티파일)
    base.prisma                     # generator + datasource
    {model}.prisma                  # 도메인별 모델 (1파일 1도메인)
```
