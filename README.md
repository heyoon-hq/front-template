# My App

Next.js + TypeScript + Prisma + PostgreSQL + Tailwind CSS 스타터 템플릿

Todo + Category CRUD 예제가 포함되어 있어 데이터 흐름과 코드 패턴을 바로 확인할 수 있습니다.

## 사전 준비

### 공통 (Windows / macOS)

| 도구 | 버전 | 설치 확인 |
|------|------|----------|
| Node.js | 20.19+ | `node -v` |
| pnpm | 9+ | `pnpm -v` |
| Docker Desktop | 최신 | `docker --version` |

### macOS

```bash
# Homebrew로 설치
brew install node
npm install -g pnpm
brew install --cask docker
```

Docker Desktop 앱을 실행하고, 상단 메뉴바에 고래 아이콘이 나타날 때까지 대기

### Windows

1. **Node.js** - https://nodejs.org 에서 LTS 다운로드 후 설치
2. **pnpm** - PowerShell에서:
   ```powershell
   npm install -g pnpm
   ```
3. **Docker Desktop** - https://www.docker.com/products/docker-desktop/ 에서 다운로드 후 설치
   - 설치 중 "Use WSL 2 instead of Hyper-V" 옵션 체크
   - 설치 후 재부팅 필요할 수 있음
   - Docker Desktop 앱을 실행하고 트레이 아이콘이 "running" 상태가 될 때까지 대기

## 프로젝트 설정

```bash
# 1. 저장소 클론
git clone <repo-url>
cd my-app

# 2. 환경 변수 설정
cp .env.example .env

# 3. Docker로 PostgreSQL 실행
docker compose up -d

# 4. 의존성 설치 (Prisma Client 자동 생성)
pnpm install

# 5. DB 마이그레이션
npx prisma migrate dev

# 6. 개발 서버 실행
pnpm dev
```

http://localhost:3000 에서 확인

## 주요 명령어

| 명령어 | 설명 |
|--------|------|
| `docker compose up -d` | PostgreSQL 시작 |
| `docker compose down` | PostgreSQL 중지 |
| `pnpm dev` | 개발 서버 (http://localhost:3000) |
| `pnpm build` | 프로덕션 빌드 |
| `npx prisma studio` | DB 관리 UI (http://localhost:5555) |
| `npx prisma migrate dev` | 마이그레이션 적용 |

## 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Backend**: Server Actions, Prisma ORM
- **Database**: PostgreSQL 16 (Docker)
- **Validation**: Zod v4
- **Server State**: TanStack Query

## 트러블슈팅

### Docker 관련

**`docker compose` 명령어가 안 됨**
- Docker Desktop 앱이 실행 중인지 확인
- Windows: Docker Desktop 설정 > General > "Use Docker Compose V2" 체크

**`permission denied while trying to connect to the docker API` 에러 (WSL)**
- **원인**: WSL에서 Docker 데몬에 접근할 수 없음
- **해결**:
  1. Windows에서 Docker Desktop 실행
  2. Docker Desktop > Settings > Resources > WSL Integration
  3. "Enable integration with my default WSL distro" 체크
  4. 사용 중인 WSL 배포판(Ubuntu 등) 활성화
  5. WSL 터미널 재시작 후 `docker compose up -d` 재실행

**포트 5432가 이미 사용 중**
- 로컬에 PostgreSQL이 이미 설치되어 있는 경우
- macOS: `brew services stop postgresql`
- Windows: 서비스 관리자에서 PostgreSQL 서비스 중지
- 또는 `docker-compose.yml`에서 포트를 `5433:5432`로 변경 후 `.env`도 수정

### Prisma 관련

**`The table does not exist` 에러**
```bash
npx prisma migrate dev
```

**`prisma generate` 실패**
```bash
pnpm install   # postinstall에서 자동 실행됨
```
