---
paths:
  - "prisma/**"
---

# Prisma 스키마 패턴

## 모델 네이밍
- 모델명: PascalCase 단수형 (`Todo`, `Category`)
- 필드명: camelCase (`createdAt`, `dueDate`, `categoryId`)

## 필수 필드
```prisma
model Example {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 관계
- `@relation` 명시적 선언
- onDelete 설정: 부모 삭제 시 자식 처리 (`Cascade`, `SetNull`)
- 역방향 관계 필드도 선언

## 마이그레이션
- `npx prisma migrate dev --name {설명}` (영문 kebab-case)
- 마이그레이션 후 `npx prisma generate` 자동 실행됨
- 프로덕션: `npx prisma migrate deploy`

## 금지 사항
- `enum` 사용 금지 → String 필드 + Zod 검증으로 대체
- PrismaClient 직접 생성 금지 → `@/server/db/prisma` import 사용

## 멀티파일 스키마
- 스키마 디렉토리: `prisma/schema/` (멀티파일 구조)
- `base.prisma`: generator + datasource 블록만 포함
- 모델 파일: 도메인별 1파일 1모델 (예: `todo.prisma`, `category.prisma`)
- 파일명: 모델명의 kebab-case 소문자 (예: `user-profile.prisma`)
- 파일 간 모델 참조 시 import 불필요 (Prisma가 자동 해석)
- 새 모델 추가: `prisma/schema/{model-name}.prisma` 파일 생성

## 타입 활용
- `import type { Todo } from "@prisma/client"` — 모델 타입 직접 사용 가능
- 관계 포함 타입은 Server Action 반환값에서 추론
