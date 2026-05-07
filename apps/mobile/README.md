# 잔향 — apps/mobile (Expo)

> Expo SDK 53 + React Native 0.76 + Expo Router 4 + NativeWind 4.
> 웹 + iOS + Android 단일 코드베이스.

---

## 설치 + 실행

```bash
# 모노레포 root 에서 1회 install
pnpm install

# 개발 서버
pnpm dev:mobile        # Expo dev server (Metro)
# 또는
pnpm --filter @resonance/mobile start
pnpm --filter @resonance/mobile web         # 웹만
pnpm --filter @resonance/mobile ios          # iOS Simulator (macOS)
pnpm --filter @resonance/mobile android      # Android Emulator
```

---

## 빌드

### 웹 (Cloudflare Pages)

```bash
pnpm build:mobile          # → apps/mobile/dist/
wrangler pages deploy apps/mobile/dist --project-name=resonance-mobile
```

### iOS / Android (EAS Build, macOS 없이도 가능)

```bash
# 1회 EAS 프로젝트 init
cd apps/mobile
pnpm exec eas init           # app.json 의 extra.eas.projectId 갱신

# 개발 빌드 (개발 client)
pnpm build:android           # eas build --platform android --profile preview
pnpm build:ios               # eas build --platform ios --profile preview
```

### 스토어 제출

```bash
pnpm submit:android          # Google Play Store internal track
pnpm submit:ios              # App Store Connect
```

`eas.json` 의 `submit.production` 의 placeholder 를 채운 후 실행.

---

## 폴더 구조

```
apps/mobile/
├── app/                      # Expo Router (file-based)
│   ├── _layout.tsx           # SafeArea + Stack + StatusBar
│   ├── index.tsx             # Title screen
│   └── nickname.tsx          # NicknameInput + Worker analyze
├── src/
│   ├── components/           # NativeWind className
│   │   ├── ActionButton.tsx
│   │   └── VoiceBubble.tsx
│   ├── services/
│   │   └── api.ts            # @resonance/shared 의 ResonanceClient
│   ├── store/
│   │   └── gameStore.ts      # Zustand
│   └── styles/
│       └── global.css        # @tailwind directives
├── assets/                    # icon / splash placeholder
├── app.json                   # Expo config (iOS/Android/web)
├── babel.config.js            # nativewind/babel + reanimated
├── metro.config.js            # pnpm workspace 호환 + withNativeWind
├── tailwind.config.js         # 잔향 다크 파스텔 토큰
├── tsconfig.json
├── eas.json                   # EAS Build + Submit profiles
└── wrangler.toml              # Cloudflare Pages
```

---

## 환경 변수

```bash
# .env (또는 EAS secrets)
EXPO_PUBLIC_WORKER_BASE_URL=http://localhost:8787       # 개발
EXPO_PUBLIC_WORKER_BASE_URL=https://resonance-worker... # 프로덕션
EXPO_PUBLIC_DEV_USER_ID=user_dev_local                  # Phase 1 placeholder
```

`EXPO_PUBLIC_*` 만 클라이언트에서 접근 가능. 시크릿은 절대 X.

---

## 디자인 토큰 (잔향 다크 파스텔)

| 변수 | 값 | 의미 |
|---|---|---|
| `bg-primary` | `#0F0E14` | 깊은 자정 |
| `fg-primary` | `#E8E3D5` | 바랜 종이 |
| `resonance` | `#B89DD0` | 잔향 — 흐릿한 라벤더 |
| `origin` | `#D4A574` | 원 — 빛 바랜 황금 |
| `danger` | `#C44848` | 빨강 (어린 시절) |
| `sky` | `#4870C4` | 파랑 (어린 시절) |

NativeWind className: `bg-bg-primary` / `text-fg-primary` / `border-resonance` 등.

---

## 인게임 워딩 (절대 변경 X)

| 한국어 | 영문 alias |
|---|---|
| 잔향(殘響) | Resonance |
| 이름을 가진 사람 | the Named |
| 목소리 | the Voice |
| 잊혀진 자 | the Forgetter |
| 모남 조각 | modaem shard |
| 꿈자국 조각 | dream-trace shard |
| 원의 자리 / 원의 아이 | the Origin / the Child of the Origin |

---

## Phase 2~5

- 모남 11카테고리 스킬 트리 화면
- 길거리 몹 + GPS Mock (4×4 grid)
- 보스전 (5체 시간 역행)
- 6엔딩 + 깨어남 시퀀스
- EAS Update (OTA)

---

> ***"잔향이 — 잠시, 머물렀어요."***
