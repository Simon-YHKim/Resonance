# 배포 가이드

잔향(Resonance) 자동 배포 — Cloudflare Pages (Expo Web) + Cloudflare Worker.

## 라이브 URL

| 라인 | URL | 갱신 트리거 |
|---|---|---|
| Worker (API) | https://resonance-worker.hwanydanh.workers.dev | main push |
| Pages (Web) | https://resonance-mobile.pages.dev | main push (production) / 그 외 branch (preview) |

## GitHub Actions Workflows

| 파일 | 트리거 | 동작 |
|---|---|---|
| `.github/workflows/deploy-worker.yml` | main push, PR | typecheck · test · (main만) D1 migration + wrangler deploy |
| `.github/workflows/deploy-pages.yml` | main + claude/* push, PR | typecheck · test · expo export · (push만) wrangler pages deploy |

## 필수 GitHub Secrets

Settings → Secrets and variables → Actions 에서 등록:

### Cloudflare 인증
| Secret | 설명 | 발급 위치 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | User API Token (NOT Global Key) | https://dash.cloudflare.com/profile/api-tokens |
| `CLOUDFLARE_ACCOUNT_ID` | 계정 ID | 대시보드 우상단 |
| `CLOUDFLARE_D1_DATABASE_ID` | resonance-d1 DB ID | `wrangler d1 list` |

#### User API Token 발급 (Custom Token 권장)
스코프:
- **Account** · Workers Scripts · Edit
- **Account** · D1 · Edit
- **Account** · Workers KV · Edit (Phase 2+ 대비)
- **Account** · Cloudflare Pages · Edit
- **Zone** 권한 불필요

> ⚠ Global API Key 는 절대 Secret 에 넣지 마세요 (모든 zone 권한). User Token 만.

### LLM 시크릿
| Secret | 설명 |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio (gemini-flash-lite-latest) |
| `ANTHROPIC_API_KEY` | (옵션) Claude Haiku 4.5 — 향후 라우팅 |

### 옵션
| Secret | 기본값 | 설명 |
|---|---|---|
| `EXPO_PUBLIC_WORKER_BASE_URL` | `https://resonance-worker.hwanydanh.workers.dev` | Pages가 호출하는 Worker URL |

## 수동 배포 (Secret 등록 전 또는 디버그)

### Worker
```bash
cd apps/worker
# wrangler.toml 의 PLACEHOLDER 를 임시로 실제 D1 ID로 치환
sed -i 's/PLACEHOLDER_RUN_WRANGLER_D1_CREATE/<database_id>/' wrangler.toml
CLOUDFLARE_API_TOKEN=<token> pnpm exec wrangler deploy
# 원복
git checkout wrangler.toml
```

### Pages
```bash
EXPO_PUBLIC_WORKER_BASE_URL=https://resonance-worker.hwanydanh.workers.dev \
  pnpm --filter @resonance/mobile export:web
CLOUDFLARE_API_TOKEN=<token> pnpm exec wrangler pages deploy apps/mobile/dist \
  --project-name=resonance-mobile --branch=main
```

## 배포 검증

```bash
# Worker health
curl https://resonance-worker.hwanydanh.workers.dev/api/health

# Pages live
curl -s -o /dev/null -w "%{http_code}\n" https://resonance-mobile.pages.dev/

# CORS preflight (Pages → Worker)
curl -X OPTIONS https://resonance-worker.hwanydanh.workers.dev/api/character/analyze \
  -H "Origin: https://resonance-mobile.pages.dev" \
  -H "Access-Control-Request-Method: POST" \
  -i | grep access-control
```

## D1 Migration

자동:
- main push → CI가 `wrangler d1 migrations apply resonance-d1 --remote` 자동 실행
- 새 migration 파일 (`apps/worker/migrations/00NN_*.sql`) 추가 후 main 머지하면 자동 적용

수동:
```bash
cd apps/worker
sed -i 's/PLACEHOLDER_RUN_WRANGLER_D1_CREATE/<database_id>/' wrangler.toml
CLOUDFLARE_API_TOKEN=<token> pnpm exec wrangler d1 migrations apply resonance-d1 --remote
git checkout wrangler.toml
```

## 시크릿 회전

LLM 키 노출 시:
1. Google AI Studio / Anthropic 콘솔 → 키 revoke + 재발급
2. GitHub Settings → Secrets → 갱신
3. main에 빈 commit push (workflow 트리거)

Cloudflare Token 노출 시:
1. https://dash.cloudflare.com/profile/api-tokens → roll/delete → 재발급
2. 동일 단계
