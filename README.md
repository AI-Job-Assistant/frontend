# 새싹 — AI 취업 준비 도우미 (프론트엔드)

2026 AI융합학부 IT경진대회. 새싹 캐릭터 기반 AI 모의 면접 프론트엔드.
화면 전환: react-router (URL 기반).

## 실행
```bash
npm install
npm run dev
```

## 라우팅 구조
| URL | 화면 |
|-----|------|
| `/login` | 로그인 |
| `/signup` | 회원가입 |
| `/` | 메인 (텍스트/스피킹 선택) |
| `/setup` | 면접 설정 |
| `/interview/text` | 텍스트 면접 |
| `/interview/speak` | 스피킹 면접 |
| `/loading` | 채점 로딩 (자동으로 /result 이동) |
| `/result` | 결과 |
| `/mypage` | 마이페이지 |

- 로그인 안 한 상태로 내부 URL 접근 시 `/login`으로 보냄 (App.jsx의 Protected)
- 공유 상태(학번·면접 모드·설정)는 `AppContext.jsx`에 보관
  → URL은 "어떤 화면", Context는 "그 화면이 쓸 데이터"를 담당

## 폴더 구조
```
src/
├─ App.jsx              라우트 정의 + 로그인 가드
├─ AppContext.jsx       전역 상태(studentId, mode, config)
├─ main.jsx             BrowserRouter + AppProvider 로 감쌈
├─ styles/
│  ├─ tokens.js         색·옵션·더미데이터·GROWTH 색단계
│  └─ global.css        Pretendard Variable + 전역
├─ components/
│  ├─ Characters.jsx    Sprout(PNG) · SproutBadge · Icon(라인 아이콘)
│  ├─ UI.jsx            Btn·Field·Card·Chip·Section·Eyebrow·Logo
│  └─ Layout.jsx        Shell·TopBar·Progress·Timer·useTimer
└─ screens/             화면 9개 (각자 useNavigate·useApp 사용)
```

## 백엔드 연동 포인트
- `tokens.js`의 QUESTIONS, FEEDBACK → API 응답으로 교체
- `AppContext.jsx`의 login → Firebase Auth 토큰 발급
- `screens/Loading.jsx`의 setTimeout → 실제 채점 API 대기
- 마이페이지 프로필 부제("데이터 분석가·신입·…")는 고정값 → 사용자 데이터로

## 배포 시 주의 (SPA)
react-router는 클라이언트 라우팅이라, 정적 호스팅에 올릴 땐
모든 경로를 index.html로 보내는 fallback 설정이 필요해요.
- Vercel: 자동 처리됨
- Netlify: `public/_redirects`에 `/*  /index.html  200`
- `npm run dev` / `npm run preview`는 자동 처리 (로컬 개발은 신경 안 써도 됨)
