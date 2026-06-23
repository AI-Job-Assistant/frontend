/* ============================================================
   인증 헬퍼 — 학번 기반 로그인을 Firebase(이메일/비번)에 매핑
   학번 20201234 → 20201234@sprout.app 가짜 이메일로 변환
   ============================================================ */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase";

/* 학번을 Firebase용 가짜 이메일로 */
const EMAIL_DOMAIN = "sprout.app";
export function studentIdToEmail(studentId) {
  return `${String(studentId).trim()}@${EMAIL_DOMAIN}`;
}
/* 반대로, 이메일에서 학번만 뽑기 (로그인 상태 복원 시 사용) */
export function emailToStudentId(email) {
  return email ? email.split("@")[0] : "";
}

/* 회원가입 — 학번 + 비번 (+ 이름은 displayName으로 저장) */
export async function signUp({ studentId, password, name }) {
  const email = studentIdToEmail(studentId);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }
  return cred.user;
}

/* 로그인 — 학번 + 비번 */
export async function signIn({ studentId, password }) {
  const email = studentIdToEmail(studentId);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/* 로그아웃 */
export async function logOut() {
  await signOut(auth);
}

/* Firebase 에러 코드를 한국어 메시지로 */
export function authErrorMessage(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "학번 또는 비밀번호가 올바르지 않아요.";
    case "auth/email-already-in-use":
      return "이미 가입된 학번이에요. 로그인해주세요.";
    case "auth/weak-password":
      return "비밀번호는 6자 이상이어야 해요.";
    case "auth/too-many-requests":
      return "잠시 후 다시 시도해주세요.";
    case "auth/network-request-failed":
      return "네트워크 연결을 확인해주세요.";
    default:
      return "문제가 발생했어요. 다시 시도해주세요.";
  }
}
