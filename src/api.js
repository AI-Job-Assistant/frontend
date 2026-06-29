// src/api.js
import { QTYPE_MAP, JOB_MAP, QUESTIONS, FEEDBACK } from "./styles/tokens";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* 공통 fetch 래퍼 — JSON 요청/응답, 에러·로그 처리 */
async function req(path, { method = "GET", body } = {}) {
  const url = `${BASE}${path}`;
  console.log(`[api] → ${method} ${url}`, body ?? "");
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
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
export async function createQuestions(jobLabel, qtypeLabel) {
  const jobPart = JOB_MAP[jobLabel];          // { jobId } 또는 { jobName }
  const questionType = QTYPE_MAP[qtypeLabel]; // Figma 표기 → 명세서 Enum

  if (!jobPart) throw new Error(`매핑 안 된 직무: ${jobLabel}`);
  if (!questionType) throw new Error(`매핑 안 된 질문유형: ${qtypeLabel}`);

  try {
    return await req("/api/interview/questions", {
      method: "POST",
      body: { ...jobPart, questionType },
    });
  } catch (e) {
    // 서버 꺼짐 등 → 더미 질문으로 폴백 (개발 계속 가능)
    console.warn("[api] 질문 생성 실패 → 더미 폴백:", e.message);
    return {
      sessionId: null,  // null이면 폴백 세션이란 뜻
      jobName: jobLabel,
      questionType,
      questions: QUESTIONS.map((content, i) => ({
        id: null, orderNo: i + 1, content,
      })),
    };
  }
}

/* ── 2. 답변 평가 ───────────────────────────────
   extra = { sessionId, smileCount, eyeContactRatio } (스피킹만) */
export async function evaluateAnswer({ questionId, question, answer, questionType, extra }) {
  const body = { questionId, question, answer, questionType, ...(extra || {}) };
  try {
    return await req("/api/interview/feedback", { method: "POST", body });
  } catch (e) {
    console.warn("[api] 평가 실패 → 더미 폴백:", e.message);
    const dummy = FEEDBACK.perQ[(question?.length || 0) % 5] || FEEDBACK.perQ[0];
    return {
      answerId: null,
      questionType,
      score: dummy.score,
      strengths: [dummy.strength],
      improvements: [dummy.improve],
      suggestion: dummy.suggest,
    };
  }
}

/* ── 3~6. 마이페이지 (4차에서 화면 연결) ───────── */
export const getStats    = () => req("/api/mypage/stats");
export const getHistory  = () => req("/api/mypage/history");
export const getHeatmap  = () => req("/api/mypage/heatmap");
export const getAnalysis = () => req("/api/mypage/analysis");