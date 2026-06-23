# Firebase 로그인 설정 가이드

이 프로젝트는 로그인/회원가입에 Firebase Authentication을 씁니다.
학번을 가짜 이메일(`학번@sprout.app`)로 변환해 Firebase에 저장하는 방식이에요.

## 1. Firebase 콘솔 설정 (최초 1회)

1. https://console.firebase.google.com 접속 → 구글 로그인
2. **프로젝트 만들기** → 이름 입력 (예: sprout-interview)
   - Google 애널리틱스는 꺼도 됨
3. 왼쪽 **빌드 → Authentication → 시작하기**
4. **Sign-in method** 탭 → **이메일/비밀번호** → 위쪽 토글 켜기 → 저장
5. 왼쪽 위 ⚙️ → **프로젝트 설정** → 아래 **내 앱** → 웹 `</>` 아이콘
6. 앱 닉네임 입력 → 앱 등록 → 나오는 `firebaseConfig` 값 복사

## 2. .env 파일 만들기

프로젝트 루트(package.json 옆)에 `.env` 파일을 만들고,
복사한 값을 아래 형식으로 채우세요. (.env.example 참고)

```
VITE_FB_API_KEY=AIza...
VITE_FB_AUTH_DOMAIN=sprout-xxxx.firebaseapp.com
VITE_FB_PROJECT_ID=sprout-xxxx
VITE_FB_STORAGE_BUCKET=sprout-xxxx.appspot.com
VITE_FB_SENDER_ID=1234567890
VITE_FB_APP_ID=1:1234567890:web:abcdef
```

firebaseConfig 키 이름 → .env 변수 매핑:
- apiKey            → VITE_FB_API_KEY
- authDomain        → VITE_FB_AUTH_DOMAIN
- projectId         → VITE_FB_PROJECT_ID
- storageBucket     → VITE_FB_STORAGE_BUCKET
- messagingSenderId → VITE_FB_SENDER_ID
- appId             → VITE_FB_APP_ID

## 3. 실행

```bash
npm install
npm run dev
```

.env 를 만든 뒤 dev 서버를 **새로 켜야** 값이 반영됩니다.
(이미 켜져 있었다면 끄고 npm run dev 다시)

## 동작 방식
- 회원가입: 학번 + 비번 + 이름 → Firebase에 계정 생성, 이름은 displayName에 저장
- 로그인: 학번 + 비번 → Firebase 인증 → 메인으로
- 새로고침해도 로그인 유지됨 (onAuthStateChanged가 자동 복원)
- 로그인 안 한 채 내부 URL 접근 시 /login 으로 보냄

## 주의
- `.env`는 .gitignore에 등록돼 있어 깃에 안 올라갑니다. 키 안전.
- 백엔드(MySQL) 연동 시: Firebase의 uid를 users 테이블과 연결하세요.
  user.uid 는 AppContext의 user 객체에서 꺼낼 수 있습니다.
