# 새싹(Sprout) — AI 모의 면접 프론트엔드

2026 AI융합학부 IT경진대회 출품작. 새싹 캐릭터가 성장하는 컨셉의 AI 모의 면접 서비스 프론트엔드입니다.
화면 전환은 `react-router-dom`(URL 기반)으로 처리하고, 백엔드(Node/Express + MySQL)와 REST API로 통신합니다.

## 실행

```bash
npm install
npm run dev       # 개발 서버
npm run build      # 프로덕션 빌드 (dist/)
npm run preview    # 빌드 결과 로컬 미리보기
```

### 환경변수 (`.env`)
```
VITE_API_BASE=http://localhost:5000   # 백엔드 API 주소 (배포 시 실제 서버 주소로 교체)
```
`.env`가 없으면 `http://localhost:5000`으로 자동 폴백됩니다 (`auth.js`, `api.js`).

## 인증 방식

백엔드 자체 JWT 인증을 사용합니다.

- `POST /api/auth/login`, `POST /api/auth/signup`을 직접 호출 (`auth.js`)
- 로그인 성공 시 `token`, `userId`, `studentId`, `userName`을 `localStorage`에 저장
- API 요청마다 `Authorization: Bearer {token}` 헤더 첨부 (`api.js`)
- 401 응답 시 자동 로그아웃 + `/login` 이동
- 새로고침 시 `AppContext.jsx`가 `localStorage`에서 로그인 상태 즉시 복원 (`authReady`)

`firebase.json`은 Firebase Hosting 배포 설정용입니다.

## 라우팅 구조

| URL | 화면 | 비고 |
|---|---|---|
| `/login` | 로그인 | |
| `/signup` | 회원가입 | |
| `/` | 메인 (텍스트/스피킹 선택) | Protected |
| `/setup` | 면접 설정 | Protected |
| `/interview/text` | 텍스트 면접 | Protected |
| `/interview/speak` | 스피킹 면접 | Protected, 얼굴 분석 포함 |
| `/loading` | 채점 로딩 | Protected |
| `/transition` | 화면 전환 로딩 | Protected |
| `/result/:sessionId` | 결과 (세션별) | Protected |
| `/mypage` | 마이페이지 | Protected |
| `*` | 정의되지 않은 경로 | `/`로 리다이렉트 |

- 비로그인 상태로 보호된 경로 접근 시 `/login`으로 이동 (`App.jsx`의 `Protected`)
- 공유 상태(로그인 정보·면접 모드·설정·세션·답변·피드백)는 `AppContext.jsx`에서 관리
  → URL은 "어떤 화면", Context는 "그 화면이 쓸 데이터" 담당
- 화면 컴포넌트는 모두 `lazy()`로 지연 로딩

## 폴더 구조

```
src/
├─ App.jsx              라우트 정의 + 로그인 가드(Protected) + lazy loading
├─ AppContext.jsx        전역 상태 (studentId, session, answers, feedbacks, 카메라 예열 등)
├─ auth.js               로그인/회원가입/로그아웃/토큰 관리 (백엔드 JWT)
├─ api.js                공통 fetch 래퍼 + 질문생성·평가·마이페이지 API
├─ useFaceAnalysis.js     스피킹 면접용 얼굴 분석 훅 (face-api)
├─ main.jsx               BrowserRouter + AppProvider로 감쌈
├─ styles/
│  ├─ tokens.js           색상 토큰·직무/질문유형 매핑(JOB_MAP, QTYPE_MAP)·더미데이터
│  └─ global.css          Pretendard Variable + 전역 스타일
├─ components/
│  ├─ Characters.jsx      Sprout(PNG) · SproutBadge · Icon(라인 아이콘)
│  ├─ UI.jsx               Btn·Field·Card·Chip·Section·Eyebrow·Logo
│  ├─ Layout.jsx           Shell·TopBar(로그아웃 확인 포함)·Progress·Timer·useTimer
│  └─ ChallengeModal.jsx   도전 모드 안내 모달
└─ screens/                Login, Signup, Main, Setup, TextInterview,
                            SpeakInterview, Loading, TransitionLoading,
                            Result, Mypage (10개)
```

## 주요 기능 흐름

1. **로그인/회원가입** → 백엔드 JWT 발급 → `AppContext`에 로그인 상태 반영
2. **메인**에서 텍스트/스피킹 모드 선택 (스피킹 선택 시 카메라 프리워밍 시작)
3. **설정**에서 직무·질문유형·면접 스타일 선택 → `createQuestions()` 호출
4. **면접 진행** (텍스트 또는 스피킹, 스피킹은 `useFaceAnalysis`로 표정/시선 수집)
5. **로딩** 화면에서 답변 평가 API 대기 → **결과** 화면(`/result/:sessionId`)으로 이동
6. **마이페이지**에서 통계·히스토리·히트맵·분석·목표 조회/수정

## 배포 시 주의 (SPA)

react-router는 클라이언트 라우팅이라, 정적 호스팅에 올릴 땐 모든 경로를 `index.html`로 보내는 fallback 설정이 필요합니다.

- **Firebase Hosting**: `firebase.json`의 `rewrites`로 이미 처리됨
- Vercel: 자동 처리됨
- Netlify: `public/_redirects`에 `/*  /index.html  200`
- `npm run dev` / `npm run preview`는 로컬에서 자동 처리됨

## 백엔드 연동 시 확인할 것

- API 응답 스펙이 `api.js`의 요청/파싱 로직과 일치하는지 (특히 `success`/`data` 래핑 여부)
- `tokens.js`의 `JOB_MAP`, `QTYPE_MAP`이 백엔드 Enum과 정확히 일치하는지
- 마이페이지 통계/히스토리/히트맵/분석 API(`/api/mypage/*`)가 실제 응답을 내려주는지 (더미 데이터 대체 지점)
- 회원가입 시 백엔드 자체 비밀번호 정책이 프론트 검증 규칙(8자 이상)보다 더 엄격하지 않은지
