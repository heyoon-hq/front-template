---
description: 프로젝트 폴더 구조 및 파일 배치 규칙
---

# 폴더 구조

```
app/                              # 라우팅 + 페이지
  providers.tsx                   # QueryClientProvider
  layout.tsx                      # Providers 래핑
  (main)/                         # Route Group (도메인별 페이지)
    layout.tsx                    # 공통 네비게이션
    {domain}/page.tsx             # 도메인 페이지
  api/                            # API Routes (CSR 데이터 통신)
    {feature}/
      route.ts                    # GET(전체), POST(생성)
      [id]/route.ts               # PATCH(수정), DELETE(삭제)
components/
  ui/                             # shadcn/ui (자동 생성, 직접 수정 지양)
  layout/                         # 공통 레이아웃 컴포넌트
  {feature}/                      # 기능별 컴포넌트
hooks/                            # TanStack Query 훅
  use-{feature}.ts                # useQuery + useMutation (fetch → API Routes)
server/
  actions/{feature}.ts            # Server Actions (SSR 초기 데이터용, Service 위임)
  controllers/{feature}.controller.ts  # HTTP 요청/응답 처리 (API Route에서 호출)
  services/{feature}.service.ts   # 비즈니스 로직 + Zod 검증 (핵심 계층)
  dto/{feature}.dto.ts            # Request/Response DTO + Zod 스키마
  db/prisma.ts                    # DB 싱글턴 (수정 금지)
lib/
  validations/{feature}.ts        # Zod 기본 스키마 (DTO에서 재사용)
  api/                            # API 응답 포맷 유틸
    response.ts                   # ApiResponse.success, ApiResponse.error
    error-handler.ts              # handleApiError
  utils.ts                        # cn 등 공유 유틸
  zod-config.ts                   # Zod 커스텀 에러 메시지 (한국어)
prisma/
  schema/                           # DB 스키마 (멀티파일)
    base.prisma                     # generator + datasource
    {model}.prisma                  # 도메인별 모델 (1파일 1도메인)
```
