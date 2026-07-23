// src/api.js
import { QTYPE_MAP, JOB_MAP } from "./styles/tokens";
import { getToken } from "./auth";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* 공통 fetch 래퍼 — JSON 요청/응답, 에러·로그 처리 */
async function req(path, { method = "GET", body } = {}) {
  const url = `${BASE}${path}`;
  console.log(`[api] → ${method} ${url}`, body ?? "");

  const token = getToken(); // 저장된 JWT (없으면 null)
  const headers = {
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  // 서버가 안 떠 있으면 index.html(HTML)이 와서 JSON 파싱이 깨짐 → 명확한 에러로
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`서버 응답이 JSON이 아니에요 (서버 꺼짐?): ${path}`);
  }
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  console.log(`[api] ← ${method} ${url}`, data);
  return data;
}

/* ── 1. 질문 생성 ───────────────────────────────
   화면 직무·유형 → 명세서 Enum/jobId·jobName 변환해서 전송 */
export async function createQuestions(jobLabel, qtypeLabel, opts = {}) {
  const jobPart = JOB_MAP[jobLabel];
  const questionType = QTYPE_MAP[qtypeLabel];

  if (!jobPart) throw new Error(`매핑 안 된 직무: ${jobLabel}`);
  if (!questionType) throw new Error(`매핑 안 된 질문유형: ${qtypeLabel}`);

  const body = { ...jobPart, questionType };
  if (opts.mode) body.mode = opts.mode;        // "텍스트" | "스피킹"
  if (opts.isChallenge) body.count = 1;         // 도전모드 신호 → 백엔드가 자동으로 "도전" 처리

  return await req("/api/interview/questions", {
    method: "POST",
    body,
  });
}
/* ── 2. 답변 평가 ───────────────────────────────
   extra = { sessionId, smileCount, eyeContactRatio } (스피킹만) */
export async function evaluateAnswer({ questionId, question, answer, questionType, extra }) {
  const body = { questionId, question, answer, questionType, ...(extra || {}) };
  // 더미 폴백 없음 — 실패하면 그대로 위로 던져서 화면에서 처리
  return await req("/api/interview/feedback", { method: "POST", body });
}

/* ── 3~6. 마이페이지 (4차에서 화면 연결) ───────── */
export const getStats    = () => req("/api/mypage/stats");
export const getHistory  = () => req("/api/mypage/history");
export const getHeatmap  = () => req("/api/mypage/heatmap");
export const getAnalysis = () => req("/api/mypage/analysis");