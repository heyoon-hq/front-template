---
name: nextjs-init
description: 새 Next.js 프로젝트를 생성하거나, 프로젝트 템플릿을 스캐폴딩하거나, 초기 구조를 세팅할 때 사용합니다. 범용 스캐폴더가 아니라 이 레포의 표준 템플릿으로, 팀 컨벤션(CLAUDE.md + rules + 9개 코드 패턴)이 사전 적용된 Next.js 16 프로젝트를 생성합니다 (Prisma 6, Zod v4, TanStack Query, shadcn/ui 포함). 트리거: "프로젝트 만들어줘", "nextjs로 만들어줘", "프로젝트 초기 세팅", "새 프로젝트", "프로젝트 템플릿", "스캐폴딩", "create nextjs project", "init project", "project setup", "bootstrap project". 사용자가 Next.js로 새 프로젝트를 시작하려 할 때 "템플릿"이나 "스캐폴드"를 명시하지 않아도 이 스킬을 사용합니다.
---

# Next.js Project Init

> 프로젝트명 하나로 팀 컨벤션이 적용된 Next.js 프로젝트 초기 구조를 자동 생성합니다.

## WHEN TRIGGERED - EXECUTE IMMEDIATELY

이 문서는 실행 지시서다. 첫 AskUserQuestion 도구를 즉시 호출한다.

---

## Workflow

### Step 1: 프로젝트 정보 수집 (prompt)

사용자 입력에서 프로젝트명을 파싱한다. 파싱된 이름을 npm 패키지명 규격(소문자, 하이픈)으로 변환하고 사용자에게 확인한다.

**EXECUTE:** AskUserQuestion 호출:

```json
{
  "questions": [
    {
      "question": "프로젝트 이름을 확인해주세요. 이 이름으로 폴더와 package.json이 생성됩니다.",
      "header": "프로젝트명",
      "options": [
        {"label": "{파싱된 kebab-case 이름} (추천)", "description": "npm 규격에 맞게 변환된 이름입니다."},
        {"label": "다른 이름으로 할게요", "description": "직접 프로젝트 이름을 입력하세요."}
      ],
      "multiSelect": false
    }
  ]
}
```

### Step 2: 컨텍스트 로딩 (rag)

Read `references/project-rules.md` — CLAUDE.md, 폴더 구조, 레시피, 코딩 표준, 검증 규칙.
Read `references/patterns.md` — 경로별 코드 패턴 (page, components, hooks, services 등).
Read `references/boilerplate.md` — 보일러플레이트 파일 템플릿.

### Step 3: 프로젝트 골격 생성 (generate)

확인된 프로젝트명으로 `{projectName}` 플레이스홀더를 치환하여 아래 파일들을 순서대로 생성한다. 생성 전 대상 경로에 파일이 이미 존재하는지 확인하고, 존재하면 건너뛴다.

**생성 순서:**

1. **설정 파일**: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `components.json`, `.env.example`, `docker-compose.yml`, `.gitignore`
2. **CLAUDE.md + Rules**: `CLAUDE.md`, `.claude/rules/structure.md`, `.claude/rules/recipe.md`, `.claude/rules/coding-standards.md`, `.claude/rules/verification.md`, `.claude/rules/patterns/*.md` (9개)
3. **App 기본 파일**: `app/globals.css`, `app/layout.tsx`, `app/providers.tsx`, `app/error.tsx`, `app/not-found.tsx`, `app/(main)/layout.tsx`, `app/(main)/page.tsx`
4. **Server 기본 파일**: `server/db/prisma.ts`
5. **Lib 유틸**: `lib/utils.ts`, `lib/zod-config.ts`, `lib/api/response.ts`, `lib/api/error-handler.ts`
6. **Prisma**: `prisma/schema/base.prisma`
7. **Layout 컴포넌트**: `components/layout/main-nav.tsx`

모든 파일은 `references/boilerplate.md`의 템플릿을 사용한다. 플레이스홀더 치환 규칙:
- `{projectName}` → 실제 프로젝트명 (kebab-case)
- `{projectTitle}` → 표시용 이름 (설정 파일, metadata 등)
- `__PROJECT_TITLE__` → 표시용 이름 (JSX 내부 전용 — `app/(main)/page.tsx`, `components/layout/main-nav.tsx`)
- `{dbName}` → DB명 (언더스코어)

### Step 4: 검증 + 안내 (review)

생성된 파일 목록을 요약하고, 다음 단계를 안내한다:

```
프로젝트 초기 세팅이 완료되었습니다!

생성된 파일: {N}개
- 설정 파일: package.json, tsconfig.json, next.config.ts 등
- CLAUDE.md + Rules: 4개 규칙 + 9개 패턴
- App 기본 파일: layout, providers, error, not-found
- Server/Lib: prisma.ts, utils, zod-config, api 유틸
- Prisma: base.prisma

다음 명령어를 순서대로 실행하세요:
1. pnpm install
2. docker compose up -d
3. npx prisma migrate dev --name init
4. pnpm dlx shadcn@latest add button input badge card checkbox select popover calendar  ← pnpm install 이후에 실행 (node_modules 필요)
5. pnpm dev
```

---

## References

- **`references/project-rules.md`** — CLAUDE.md + 4개 규칙 파일 (structure, recipe, coding-standards, verification)
- **`references/patterns.md`** — 9개 경로별 코드 패턴
- **`references/boilerplate.md`** — 모든 보일러플레이트 파일 템플릿

## Settings

| Setting | Default | Change |
|---------|---------|--------|
| DB name | `{projectName}_db` (하이픈→언더스코어) | Step 1에서 변경 가능 |
| DB port | `5432` | `.env.example`에서 변경 |
| Theme | dark | `app/layout.tsx`에서 변경 |
