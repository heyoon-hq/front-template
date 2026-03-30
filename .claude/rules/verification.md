---
description: 작업 완료 후 필수 검증 체크리스트
---

# 작업 후 검증

## 필수 체크

- 코드 변경 후: `npx tsc --noEmit`
- 패키지 설치/변경 후: `npx prisma generate`
- 최종 검증: `pnpm build`

## 품질 셀프체크

코드 완성 전 확인:
- 모든 외부 입력에 Zod 검증이 있는가
- Server Actions에 try/catch 에러 처리가 있는가
- 임포트 경로가 기존 코드베이스 패턴과 일치하는가
