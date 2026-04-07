# nextjs-init 스킬 동작 흐름 상세 설명

> "프로젝트 만들어줘"라는 프롬프트 하나가 어떻게 36개 파일 생성으로 이어지는지, Claude Code 공식 문서와 실제 코드를 교차 참조하여 설명합니다.

---

## 1. Claude Code 스킬 시스템 개요

> 출처: https://docs.anthropic.com/en/docs/claude-code/skills

### 1.1 스킬이란?

스킬(Skill)은 Claude Code에서 **특정 작업을 자동화하는 마크다운 지시서**입니다. 코드가 아니라 자연어로 작성되며, Claude가 이를 읽고 해석하여 도구(Read, Write, AskUserQuestion 등)를 호출하는 방식으로 동작합니다.

### 1.2 디렉토리 구조

```
.claude/skills/<skill-name>/
├── SKILL.md              # 필수: 스킬 정의 + 실행 지시
├── references/           # 선택: 참조 문서 (RAG 패턴)
│   ├── doc1.md
│   └── doc2.md
└── scripts/              # 선택: 실행 스크립트
```

### 1.3 스코프 우선순위

동일한 스킬이 여러 위치에 존재할 때 적용 우선순위:

| 우선순위 | 스코프 | 경로 |
|:--------:|--------|------|
| 1 | Enterprise | 서버 배포 (조직 관리자 설정) |
| 2 | Personal | `~/.claude/skills/<name>/SKILL.md` |
| 3 | Project | `.claude/skills/<name>/SKILL.md` |
| 4 | Plugin | `<plugin>/skills/<name>/SKILL.md` |

### 1.4 frontmatter 메타데이터

SKILL.md 최상단의 YAML frontmatter가 스킬의 **신원증** 역할을 합니다:

```yaml
---
name: skill-name              # 식별자, /slash-command로 직접 호출 가능
description: What this does   # Claude가 자동 활성화 여부를 판단하는 핵심 필드
---
```

**주요 선택 필드:**

| 필드 | 역할 | 예시 |
|------|------|------|
| `allowed-tools` | 스킬 실행 중 허가할 도구 제한 | `Read Grep Glob` |
| `model` | 스킬 실행에 사용할 모델 오버라이드 | `sonnet` |
| `context: fork` | 격리된 서브에이전트에서 실행 | — |
| `disable-model-invocation` | Claude 자동 호출 차단 (사용자만 호출 가능) | `true` |
| `user-invocable` | `/` 메뉴에서 숨김 (Claude만 호출 가능) | `false` |
| `paths` | 특정 파일 경로에서만 활성화 | `["app/**"]` |

### 1.5 CLAUDE.md와의 차이

| | CLAUDE.md | 스킬 (SKILL.md) |
|---|---|---|
| **로딩 시점** | 세션 시작 시 항상 | 트리거될 때만 (온디맨드) |
| **역할** | 프로젝트 전체 규칙/컨텍스트 | 특정 작업의 자동화 워크플로우 |
| **구조** | 자유 형식 마크다운 | frontmatter + 단계별 지시 |
| **컨텍스트 소비** | 항상 점유 | 필요할 때만 점유 → 효율적 |

### 1.6 Progressive Disclosure

공식 문서에 따르면, Claude는 **2단계**로 스킬을 로딩합니다:

1. **1단계**: 모든 스킬의 `description`만 먼저 로드 (가벼움)
2. **2단계**: 사용자 입력과 매칭되는 스킬의 전체 body를 로드 (필요할 때만)

→ 수십 개의 스킬이 설치되어 있어도 컨텍스트 윈도우를 효율적으로 사용합니다.

---

## 2. nextjs-init 스킬 파일 구조

### 2.1 전체 구성

```
.claude/skills/nextjs-init/
├── SKILL.md                      (102줄)  — 실행 지시서
└── references/
    ├── project-rules.md          (239줄)  — CLAUDE.md + 4개 규칙 템플릿
    ├── patterns.md               (469줄)  — 9개 코드 패턴 템플릿
    └── boilerplate.md            (715줄)  — 모든 파일 보일러플레이트
```

**총 1,525줄, ~8,500 단어** — 이것으로 36개 파일을 생성합니다.

### 2.2 RAG 패턴 설계

이 스킬은 **RAG(Retrieval-Augmented Generation)** 패턴을 사용합니다:

```
SKILL.md (102줄)          → "무엇을 할지" 지시만 담당
  ↓ Step 2에서 Read 호출
references/ (1,423줄)     → "실제 내용"은 여기에 분리
```

**왜 분리하는가?**
- SKILL.md에 모든 내용을 넣으면 → 스킬이 활성화될 때마다 1,525줄 전체가 컨텍스트에 로드
- 분리하면 → SKILL.md 102줄만 먼저 로드, 나머지는 Step 2에서 필요할 때만 Read

### 2.3 생성 파일 카테고리

| 카테고리 | 참조 파일 | 생성 파일 수 | 내용 |
|----------|-----------|:-----------:|------|
| 설정 파일 | boilerplate.md | 8 | package.json, tsconfig.json 등 |
| CLAUDE.md + Rules | project-rules.md | 5 | CLAUDE.md + 4개 규칙 파일 |
| 코드 패턴 | patterns.md | 9 | `.claude/rules/patterns/*.md` |
| App 기본 파일 | boilerplate.md | 7 | layout, providers, error, not-found 등 |
| Server/Lib | boilerplate.md | 5 | prisma.ts, utils, zod-config, api 유틸 |
| Prisma | boilerplate.md | 1 | base.prisma |
| Components | boilerplate.md | 1 | main-nav.tsx |
| **합계** | | **36** | |

---

## 3. 트리거 → 활성화 과정

### 3.1 SKILL.md의 description

```yaml
---
name: nextjs-init
description: 새 Next.js 프로젝트를 생성하거나, 프로젝트 템플릿을 스캐폴딩하거나,
  초기 구조를 세팅할 때 사용합니다. ... 트리거: "프로젝트 만들어줘", "nextjs로 만들어줘",
  "프로젝트 초기 세팅", "새 프로젝트", "프로젝트 템플릿", "스캐폴딩",
  "create nextjs project", "init project", "project setup", "bootstrap project".
---
```

### 3.2 활성화 흐름

```
사용자: "프로젝트 만들어줘"
  │
  ▼ ① Progressive Disclosure 1단계
Claude: 설치된 모든 스킬의 description 스캔
  │
  ▼ ② 트리거 매칭
"프로젝트 만들어줘" ∈ description의 트리거 키워드 → 매칭 성공
  │
  ▼ ③ Progressive Disclosure 2단계
SKILL.md 전체 body 로드 (102줄)
  │
  ▼ ④ 실행 시작
"이 문서는 실행 지시서다. 첫 AskUserQuestion 도구를 즉시 호출한다."
```

### 3.3 활성화 방식 2가지

| 방식 | 예시 | 설명 |
|------|------|------|
| **자동 활성화** | "프로젝트 만들어줘" | description 기반 의미 매칭 |
| **직접 호출** | `/nextjs-init` | slash command로 명시적 호출 |

---

## 4. 4단계 워크플로우 상세

SKILL.md가 정의하는 4단계를 실제 코드와 함께 설명합니다.

### 4.1 Step 1: 프로젝트 정보 수집 (prompt)

**SKILL.md 원문:**
```markdown
### Step 1: 프로젝트 정보 수집 (prompt)

사용자 입력에서 프로젝트명을 파싱한다.
파싱된 이름을 npm 패키지명 규격(소문자, 하이픈)으로 변환하고 사용자에게 확인한다.

**EXECUTE:** AskUserQuestion 호출:
```

**Claude가 실제로 하는 일:**

1. 사용자 입력에서 프로젝트명 추출 (예: "쇼핑몰 프로젝트 만들어줘" → "쇼핑몰")
2. kebab-case로 변환 → `shopping-mall`
3. `AskUserQuestion` 도구 호출:

```json
{
  "questions": [{
    "question": "프로젝트 이름을 확인해주세요. 이 이름으로 폴더와 package.json이 생성됩니다.",
    "options": [
      {"label": "shopping-mall (추천)", "description": "npm 규격에 맞게 변환된 이름입니다."},
      {"label": "다른 이름으로 할게요", "description": "직접 프로젝트 이름을 입력하세요."}
    ]
  }]
}
```

4. 확인된 이름으로 **4개 플레이스홀더** 생성:

| 플레이스홀더 | 변환 규칙 | 예시 | 사용처 |
|-------------|-----------|------|--------|
| `{projectName}` | kebab-case | `shopping-mall` | package.json name, 폴더명 |
| `{projectTitle}` | 표시용 이름 | `Shopping Mall` | metadata, 설정 파일 |
| `__PROJECT_TITLE__` | 표시용 이름 | `Shopping Mall` | JSX 내부 전용 (JS 변수 혼동 방지) |
| `{dbName}` | 언더스코어 | `shopping_mall_db` | PostgreSQL DB명, Docker env |

> **`__PROJECT_TITLE__`이 별도로 필요한 이유:**
> JSX 내부에서 `{projectTitle}`을 쓰면 JavaScript 변수 참조로 해석될 수 있습니다.
> `__PROJECT_TITLE__`은 순수 문자열 리터럴로만 사용되어 이 혼동을 방지합니다.

---

### 4.2 Step 2: 컨텍스트 로딩 (rag)

**SKILL.md 원문:**
```markdown
### Step 2: 컨텍스트 로딩 (rag)

Read `references/project-rules.md` — CLAUDE.md, 폴더 구조, 레시피, 코딩 표준, 검증 규칙.
Read `references/patterns.md` — 경로별 코드 패턴 (page, components, hooks, services 등).
Read `references/boilerplate.md` — 보일러플레이트 파일 템플릿.
```

**Claude가 실제로 하는 일:**

`Read` 도구를 3번 호출하여 references/ 파일들을 컨텍스트에 로딩합니다:

```
Read(".claude/skills/nextjs-init/references/project-rules.md")
  → 239줄: CLAUDE.md 템플릿 + 4개 규칙 파일 (structure, recipe, coding-standards, verification)

Read(".claude/skills/nextjs-init/references/patterns.md")
  → 469줄: 9개 경로별 코드 패턴 (page, components, hooks, server-actions, api-routes,
           controllers, services, validations, prisma)

Read(".claude/skills/nextjs-init/references/boilerplate.md")
  → 715줄: 22개 보일러플레이트 파일 (package.json, layout.tsx, prisma.ts 등)
```

**각 파일의 역할:**

| 참조 파일 | 줄 수 | 역할 | Step 3에서의 사용 |
|-----------|------:|------|-----------------|
| `project-rules.md` | 239 | CLAUDE.md + `.claude/rules/*.md` 원본 | CLAUDE.md, structure, recipe, coding-standards, verification 생성 |
| `patterns.md` | 469 | `.claude/rules/patterns/*.md` 원본 | 9개 패턴 파일 생성 (page, components, hooks 등) |
| `boilerplate.md` | 715 | 설정/App/Server/Lib/Prisma 파일 원본 | 22개 보일러플레이트 파일 생성 |

---

### 4.3 Step 3: 프로젝트 골격 생성 (generate)

**SKILL.md 원문:**
```markdown
### Step 3: 프로젝트 골격 생성 (generate)

확인된 프로젝트명으로 `{projectName}` 플레이스홀더를 치환하여
아래 파일들을 순서대로 생성한다.
생성 전 대상 경로에 파일이 이미 존재하는지 확인하고, 존재하면 건너뛴다.
```

**Claude가 실제로 하는 일:**

`Write` 도구를 반복 호출하여 7개 카테고리, 36개 파일을 순서대로 생성합니다.

#### 생성 순서 1: 설정 파일 (8개)

| 파일 | 플레이스홀더 사용 | 핵심 내용 |
|------|:-:|------|
| `package.json` | `{projectName}` | Next.js 16, React 19, Prisma 6, Zod v4, TanStack Query |
| `tsconfig.json` | — | strict mode, `@/*` 경로 별칭 |
| `next.config.ts` | — | 빈 템플릿 |
| `postcss.config.mjs` | — | Tailwind CSS v4 플러그인 |
| `components.json` | — | shadcn/ui 설정 (new-york 스타일) |
| `.env.example` | `{dbName}` | DATABASE_URL 템플릿 |
| `docker-compose.yml` | `{dbName}` | PostgreSQL 16, 포트 5432 |
| `.gitignore` | — | Next.js/Node.js 표준 |

**boilerplate.md의 package.json 템플릿 예시:**
```json
{
  "name": "{projectName}",
  "version": "0.1.0",
  "dependencies": {
    "@prisma/client": "^6.19.2",
    "@tanstack/react-query": "^5.90.21",
    "next": "16.1.6",
    "react": "19.2.3",
    "zod": "^4.3.6"
  }
}
```
→ `{projectName}`이 실제 이름(예: `shopping-mall`)으로 치환됩니다.

#### 생성 순서 2: CLAUDE.md + Rules (14개)

| 파일 | 출처 | 설명 |
|------|------|------|
| `CLAUDE.md` | project-rules.md | 프로젝트 전체 규칙 (76줄) |
| `.claude/rules/structure.md` | project-rules.md | 폴더 구조 다이어그램 |
| `.claude/rules/recipe.md` | project-rules.md | 11단계 구현 순서 |
| `.claude/rules/coding-standards.md` | project-rules.md | 네이밍, 임포트, 금지 항목 |
| `.claude/rules/verification.md` | project-rules.md | 검증 체크리스트 |
| `.claude/rules/patterns/page.md` | patterns.md | Page 패턴 (`app/**` 자동 로드) |
| `.claude/rules/patterns/components.md` | patterns.md | 컴포넌트 패턴 (`components/**`) |
| `.claude/rules/patterns/hooks.md` | patterns.md | TanStack Query 훅 패턴 (`hooks/**`) |
| `.claude/rules/patterns/server-actions.md` | patterns.md | Server Actions (`server/actions/**`) |
| `.claude/rules/patterns/api-routes.md` | patterns.md | API Route (`app/api/**`) |
| `.claude/rules/patterns/controllers.md` | patterns.md | Controller (`server/controllers/**`) |
| `.claude/rules/patterns/services.md` | patterns.md | Service + DTO (`server/services/**`) |
| `.claude/rules/patterns/validations.md` | patterns.md | Zod 스키마 (`lib/validations/**`) |
| `.claude/rules/patterns/prisma.md` | patterns.md | Prisma 모델 (`prisma/**`) |

> **핵심**: 9개 패턴 파일은 `paths:` frontmatter로 **트리거 경로**가 지정되어 있습니다.
> 이후 개발 시 해당 경로의 파일을 편집하면 관련 패턴이 자동으로 Claude 컨텍스트에 로드됩니다.

**patterns.md의 패턴 파일 예시 (hooks.md):**
```markdown
---
paths:
  - "hooks/**"
---

# TanStack Query 훅 패턴

## 규칙
- `"use client"` 필수
- 파일명: `use-{feature}.ts` (kebab-case, 복수형)
- 한 파일에 해당 feature의 모든 훅 포함

## queryKey 컨벤션
- 기본: `["{feature}"]` (복수형)
```
→ 나중에 `hooks/use-todos.ts`를 편집하면 이 패턴이 자동 로드되어 Claude가 규칙을 따릅니다.

#### 생성 순서 3: App 기본 파일 (7개)

| 파일 | 플레이스홀더 | 핵심 내용 |
|------|:-:|------|
| `app/globals.css` | — | Tailwind v4 + shadcn/ui + OKLch 다크/라이트 테마 |
| `app/layout.tsx` | `{projectTitle}` | Metadata, Providers 래핑, `lang="ko"`, `className="dark"` |
| `app/providers.tsx` | — | QueryClientProvider (staleTime 60초) |
| `app/error.tsx` | — | Error Boundary (Client Component) |
| `app/not-found.tsx` | — | 404 페이지 |
| `app/(main)/layout.tsx` | — | MainNav + container |
| `app/(main)/page.tsx` | `{projectTitle}`, `__PROJECT_TITLE__` | 히어로 페이지 |

**boilerplate.md의 layout.tsx 템플릿:**
```tsx
export const metadata: Metadata = {
  title: "{projectTitle}",                    // ← 설정값에서 치환
  description: "Next.js + Prisma + PostgreSQL starter template",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="dark">        {/* 한국어, 다크모드 기본 */}
      <body className="font-mono antialiased">
        <Providers>{children}</Providers>      {/* QueryClientProvider */}
      </body>
    </html>
  );
}
```

**boilerplate.md의 page.tsx에서 `__PROJECT_TITLE__` 사용:**
```tsx
export default function HomePage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">__PROJECT_TITLE__</h1>
        {/* ↑ JSX 내부이므로 {projectTitle} 대신 __PROJECT_TITLE__ 사용 */}
      </div>
    </div>
  )
}
```

#### 생성 순서 4-7: Server, Lib, Prisma, Components

| 파일 | 핵심 내용 |
|------|------|
| `server/db/prisma.ts` | PrismaClient 싱글턴 (hot reload 대응) |
| `lib/utils.ts` | `cn()` 함수 (clsx + tailwind-merge) |
| `lib/zod-config.ts` | Zod 커스텀 에러 메시지 (한국어) |
| `lib/api/response.ts` | `ApiResponse.success()`, `ApiResponse.error()` 헬퍼 |
| `lib/api/error-handler.ts` | `handleApiError()` 유틸 |
| `prisma/schema/base.prisma` | generator + datasource만 (멀티파일 스키마 준비) |
| `components/layout/main-nav.tsx` | 네비게이션 바 (`__PROJECT_TITLE__` 사용) |

**boilerplate.md의 zod-config.ts (한국어 에러 메시지):**
```typescript
import { z } from "zod/v4"

z.config({
  customError: (issue) => {
    if (issue.code === "invalid_type") {
      if (issue.input === undefined || issue.input === null) {
        return "필수 항목입니다"
      }
    }
    if (issue.code === "too_small" && issue.origin === "string") {
      if (issue.minimum === 1) return "필수 항목입니다"
      return `최소 ${issue.minimum}자 이상 입력해주세요`
    }
    // ...
  },
})

export { z }
```

#### 존재 확인 로직

SKILL.md의 지시:
```markdown
생성 전 대상 경로에 파일이 이미 존재하는지 확인하고, 존재하면 건너뛴다.
```

→ Claude가 각 파일 생성 전에 해당 경로를 확인하고, 이미 존재하면 Write를 건너뜁니다.
→ 기존 프로젝트에서 스킬을 재실행해도 기존 파일을 덮어쓰지 않습니다.

---

### 4.4 Step 4: 검증 + 안내 (review)

**SKILL.md 원문:**
```markdown
### Step 4: 검증 + 안내 (review)

생성된 파일 목록을 요약하고, 다음 단계를 안내한다:

  프로젝트 초기 세팅이 완료되었습니다!

  생성된 파일: {N}개

  다음 명령어를 순서대로 실행하세요:
  1. pnpm install
  2. docker compose up -d
  3. npx prisma migrate dev --name init
  4. pnpm dlx shadcn@latest add button input badge card checkbox select popover calendar
  5. pnpm dev
```

**Claude가 실제로 하는 일:**

1. 생성된 파일을 카테고리별로 요약
2. 사용자가 직접 실행해야 할 5단계 명령어 안내
3. `pnpm dlx shadcn@latest add ...`는 `pnpm install` 이후에 실행해야 함을 명시 (node_modules 필요)

---

## 5. Hooks 연동

### 5.1 settings.local.json의 Hooks 설정

스킬이 파일을 생성할 때, `.claude/settings.local.json`에 설정된 **hooks가 자동으로 실행**됩니다:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "npx prettier --write $CLAUDE_FILE_PATH 2>/dev/null || true"
        }]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "if echo \"$CLAUDE_FILE_PATH\" | grep -qE '\\.(ts|tsx)$'; then npx tsc --noEmit 2>&1 | head -20; fi"
        }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "... grep -cE 'rm -rf|git reset --hard|git push --force|drop table|DROP TABLE' ..."
        }]
      }
    ]
  }
}
```

### 5.2 Step 3에서의 Hook 동작

Step 3에서 Write 도구가 호출될 때마다:

```
Write("app/layout.tsx", content)
  ↓ PostToolUse 트리거 (matcher: "Write|Edit")
  ├── Hook 1: npx prettier --write app/layout.tsx     ← 자동 포맷팅
  └── Hook 2: npx tsc --noEmit                        ← TS 타입 체크 (.tsx이므로)
```

→ 36개 파일 생성 × 2개 Hook = **최대 72번의 Hook 실행**
→ 모든 생성 파일이 Prettier 포맷팅 + TypeScript 검증을 자동으로 거칩니다.

### 5.3 Hook 종류별 역할

| Hook 유형 | 트리거 시점 | matcher | 역할 |
|-----------|-----------|---------|------|
| **PostToolUse** | Write/Edit 후 | `Write\|Edit` | Prettier 포맷팅 |
| **PostToolUse** | Write/Edit 후 | `Write\|Edit` | .ts/.tsx 파일 tsc 검사 |
| **PreToolUse** | Bash 실행 전 | `Bash` | 위험 명령어 차단 (rm -rf 등) |

> 출처: https://docs.anthropic.com/en/docs/claude-code/hooks

---

## 6. references/ 파일별 상세 분석

### 6.1 project-rules.md (239줄)

**역할**: CLAUDE.md + 4개 규칙 파일의 원본 템플릿

**구조:**
```
[1-76줄]   CLAUDE.md 템플릿
  ├── 응답 규칙 (한국어)
  ├── Core Principles (우선순위, 복잡도 판단, 컨텍스트 관리)
  ├── 프로젝트 개요 (기술 스택, 데이터 흐름)
  ├── 개발 명령어
  └── 개발 지침 테이블 (4개 규칙 + 9개 패턴 링크)

[80-124줄]  rules/structure.md — 폴더 구조 다이어그램
[130-179줄] rules/recipe.md — 11단계 구현 순서 + 데이터 흐름
[185-214줄] rules/coding-standards.md — 네이밍, 임포트, 금지 항목
[220-239줄] rules/verification.md — 작업 후 체크리스트
```

**핵심 설계 의도**: 프로젝트 생성 후 Claude가 이 규칙들을 자동으로 인식하여, 모든 후속 개발에서 일관된 컨벤션을 유지합니다.

### 6.2 patterns.md (469줄)

**역할**: 9개 경로별 코드 패턴 원본

**각 패턴의 구조:**
```markdown
## patterns/{name}.md

```markdown                    ← 마크다운 코드블록으로 래핑
---
paths:                         ← 자동 로드 트리거 경로
  - "해당/경로/**"
---

# 패턴 이름

## 규칙
...

## 코드 예시
...
```                            ← 코드블록 끝
```

**9개 패턴 요약:**

| 패턴 | paths | 핵심 규칙 |
|------|-------|----------|
| page.md | `app/**` | Server Component, Metadata export, 조립만 담당 |
| components.md | `components/**` | 6가지 접미사 역할 (-form, -item, -list, -filter, -badge, -effect) |
| hooks.md | `hooks/**` | `"use client"`, queryKey 컨벤션, initialData 패턴 |
| server-actions.md | `server/actions/**` | `"use server"`, Service 위임, try/catch 한국어 메시지 |
| api-routes.md | `app/api/**` | Controller 위임, 2파일 구조 (route.ts + [id]/route.ts) |
| controllers.md | `server/controllers/**` | 객체 리터럴 export, ApiResponse 래핑 |
| services.md | `server/services/**`, `server/dto/**` | DTO safeParse, Prisma import 규칙 |
| validations.md | `lib/validations/**` | `@/lib/zod-config` import, 스키마/타입 네이밍 |
| prisma.md | `prisma/**` | PascalCase 단수형, 멀티파일 스키마, enum 금지 |

### 6.3 boilerplate.md (715줄)

**역할**: 22개 파일의 실제 코드 템플릿

**플레이스홀더 사용 현황:**

| 플레이스홀더 | 사용되는 파일 |
|-------------|-------------|
| `{projectName}` | package.json |
| `{projectTitle}` | app/layout.tsx, app/(main)/page.tsx |
| `__PROJECT_TITLE__` | app/(main)/page.tsx, components/layout/main-nav.tsx |
| `{dbName}` | .env.example, docker-compose.yml |

---

## 7. 공식 문서 참조 링크

### Claude Code 공식 문서

| 문서 | URL | 관련 내용 |
|------|-----|----------|
| **Skills** | https://docs.anthropic.com/en/docs/claude-code/skills | 스킬 시스템, frontmatter, progressive disclosure |
| **Hooks** | https://docs.anthropic.com/en/docs/claude-code/hooks | PostToolUse, PreToolUse, matcher, 환경변수 |
| **Settings** | https://docs.anthropic.com/en/docs/claude-code/settings | permissions, hooks 설정, 스코프 |

### Claude Help Center

| 문서 | URL | 관련 내용 |
|------|-----|----------|
| **Custom Skills 가이드** | https://support.claude.com/en/articles/12512198 | 커스텀 스킬 작성법 |
| **Skills 사용법** | https://support.claude.com/en/articles/12512180 | 스킬 호출, 관리 |

---

## 부록: 전체 동작 시퀀스 다이어그램

```
사용자: "프로젝트 만들어줘"
  │
  ▼ ① description 트리거 매칭
Claude: SKILL.md body 로드 (102줄)
  │
  ▼ ② Step 1 (prompt)
Claude: AskUserQuestion 호출 → 프로젝트명 확인
사용자: "shopping-mall" 선택
  │
  ▼ ③ 플레이스홀더 생성
  {projectName}     = shopping-mall
  {projectTitle}    = Shopping Mall
  __PROJECT_TITLE__ = Shopping Mall
  {dbName}          = shopping_mall_db
  │
  ▼ ④ Step 2 (rag)
Claude: Read × 3 → references/ 문서 로딩 (1,423줄)
  │
  ▼ ⑤ Step 3 (generate)
Claude: Write × 36 → 파일 생성 (플레이스홀더 치환)
  │   ├── 매 Write마다 → PostToolUse Hook 실행
  │   │   ├── Prettier 포맷팅
  │   │   └── tsc 타입 체크 (.ts/.tsx만)
  │   └── 파일 존재 시 → 건너뜀
  │
  ▼ ⑥ Step 4 (review)
Claude: 결과 요약 + 5단계 설치 명령어 안내
  │
  ▼ ⑦ 완료
사용자: pnpm install → docker compose up -d → ...
```
