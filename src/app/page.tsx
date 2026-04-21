"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Problem = {
  id: number;
  question: string;
  answer: string;
  hint: string | null;
  order_num: number;
};

type UserAnswer = {
  problem_id: number;
  answer_given: string;
  is_correct: boolean;
  attempt_count: number;
};

type ProblemState = "correct" | "incorrect" | "unattempted";

// ============================================
// เช็คคำตอบ: รองรับตัวเลข, ทศนิยม, และ text
// ============================================
function checkAnswer(input: string, correct: string): boolean {
  const normalize = (s: string) =>
    s.trim().toLowerCase().replace(/\s+/g, "");

  const inp = normalize(input);
  const cor = normalize(correct);

  // ตรง string เลย
  if (inp === cor) return true;

  // ลอง parse เป็น float เทียบ (tolerance 0.01 สำหรับทศนิยมปัดเศษ)
  const numInp = parseFloat(inp);
  const numCor = parseFloat(cor);
  if (!isNaN(numInp) && !isNaN(numCor)) {
    return Math.abs(numInp - numCor) < 0.01;
  }

  return false;
}

export default function ProblemsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [userAnswers, setUserAnswers] = useState<Map<number, UserAnswer>>(new Map());
  const [inputs, setInputs] = useState<Map<number, string>>(new Map());
  const [submitting, setSubmitting] = useState<Set<number>>(new Set());
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Map<number, string>>(new Map());

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles").select("username").eq("id", user.id).single();
    if (profile) setUsername(profile.username);

    const { data: problemsData } = await supabase
      .from("problems").select("*").order("order_num");
    if (problemsData) setProblems(problemsData);

    const { data: answersData } = await supabase
      .from("user_answers").select("*").eq("user_id", user.id);
    if (answersData) {
      const map = new Map<number, UserAnswer>();
      answersData.forEach((a) => map.set(a.problem_id, a));
      setUserAnswers(map);
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  function getState(problemId: number): ProblemState {
    const ans = userAnswers.get(problemId);
    if (!ans) return "unattempted";
    return ans.is_correct ? "correct" : "incorrect";
  }

  function setInput(problemId: number, value: string) {
    setInputs((prev) => new Map(prev).set(problemId, value));
  }

  async function submitAnswer(problem: Problem) {
    const inputVal = inputs.get(problem.id) ?? "";
    if (inputVal.trim() === "") return;

    setSubmitting((prev) => new Set(prev).add(problem.id));

    const isCorrect = checkAnswer(inputVal, problem.answer);
    const currentAnswer = userAnswers.get(problem.id);
    const attemptCount = (currentAnswer?.attempt_count ?? 0) + 1;

    const { error } = await supabase.from("user_answers").upsert(
      {
        user_id: userId,
        problem_id: problem.id,
        answer_given: inputVal.trim(),
        is_correct: isCorrect,
        attempt_count: attemptCount,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "user_id,problem_id" }
    );

    if (!error) {
      setUserAnswers((prev) => {
        const next = new Map(prev);
        next.set(problem.id, {
          problem_id: problem.id,
          answer_given: inputVal.trim(),
          is_correct: isCorrect,
          attempt_count: attemptCount,
        });
        return next;
      });

      setFeedback((prev) =>
        new Map(prev).set(problem.id, isCorrect ? "✓ ถูกต้อง!" : "✗ ไม่ถูกต้อง ลองใหม่")
      );
      setTimeout(() => {
        setFeedback((prev) => { const next = new Map(prev); next.delete(problem.id); return next; });
      }, 2000);
    }

    setSubmitting((prev) => { const next = new Set(prev); next.delete(problem.id); return next; });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

 const correctCount = Array.from(userAnswers.values()).filter((a) => a.is_correct).length;
  const totalCount = problems.length;
  const progress = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p style={{ color: "var(--text-muted)" }}>กำลังโหลดโจทย์...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Nav */}
      <nav className="nav">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontFamily: "Prompt, sans-serif", fontWeight: 800, fontSize: "1.2rem", background: "linear-gradient(135deg, #6c63ff, #63b3ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ∑ MathCheck
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/ranking" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
            🏆 อันดับ
          </Link>
          <span style={{ background: "var(--surface2)", border: "1px solid var(--border)", padding: "0.3rem 0.75rem", borderRadius: "20px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            👤 {username}
          </span>
          <button onClick={handleLogout} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "0.3rem 0.75rem", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer" }}>
            ออกจากระบบ
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Header */}
        <div className="fade-up" style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: "Prompt, sans-serif", fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            โจทย์คณิตศาสตร์
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              ทำถูกแล้ว <strong style={{ color: "var(--green)" }}>{correctCount}</strong> / {totalCount} ข้อ
            </span>
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <span className="badge badge-correct">✓ ถูก</span>
              <span className="badge badge-incorrect">✗ ผิด</span>
              <span className="badge badge-unattempted">— ยังไม่ทำ</span>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Problems */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {problems.map((problem, idx) => {
            const state = getState(problem.id);
            const ans = userAnswers.get(problem.id);
            const inputVal = inputs.get(problem.id) ?? "";
            const isSubmitting = submitting.has(problem.id);
            const fb = feedback.get(problem.id);

            return (
              <div
                key={problem.id}
                className={`problem-card fade-up ${state}`}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {/* Number badge */}
                <div style={{
                  minWidth: "36px", height: "36px", borderRadius: "8px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "JetBrains Mono, monospace", fontWeight: 600, fontSize: "0.8rem",
                  background: state === "correct" ? "var(--green-bg)" : state === "incorrect" ? "var(--red-bg)" : "var(--surface2)",
                  color: state === "correct" ? "var(--green)" : state === "incorrect" ? "var(--red)" : "var(--text-muted)",
                  border: `1px solid ${state === "correct" ? "var(--green-border)" : state === "incorrect" ? "var(--red-border)" : "var(--gray-border)"}`,
                  flexShrink: 0,
                }}>
                  {state === "correct" ? "✓" : state === "incorrect" ? "✗" : idx + 1}
                </div>

                {/* Question */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: "JetBrains Mono, monospace", fontSize: "0.95rem", fontWeight: 600,
                    color: state === "correct" ? "var(--green)" : state === "incorrect" ? "var(--red)" : "var(--text)",
                    marginBottom: "0.2rem",
                  }}>
                    {problem.question}
                  </p>
                  {problem.hint && (
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>💡 {problem.hint}</p>
                  )}
                  {ans && !ans.is_correct && (
                    <p style={{ fontSize: "0.78rem", color: "var(--red)", marginTop: "0.2rem" }}>
                      คำตอบล่าสุด: {ans.answer_given} (ครั้งที่ {ans.attempt_count})
                    </p>
                  )}
                  {ans && ans.is_correct && (
                    <p style={{ fontSize: "0.78rem", color: "var(--green)", marginTop: "0.2rem" }}>
                      คำตอบ: {ans.answer_given} (พยายาม {ans.attempt_count} ครั้ง)
                    </p>
                  )}
                </div>

                {/* Input */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                  {fb ? (
                    <span style={{
                      fontSize: "0.85rem", fontWeight: 700,
                      color: fb.startsWith("✓") ? "var(--green)" : "var(--red)",
                      minWidth: "110px", textAlign: "center",
                    }}>
                      {fb}
                    </span>
                  ) : (
                    <>
                      <input
                        className={`math-input ${state !== "unattempted" ? state : ""}`}
                        type="text"
                        value={inputVal}
                        onChange={(e) => setInput(problem.id, e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") submitAnswer(problem); }}
                        placeholder={state === "correct" ? "✓" : "คำตอบ"}
                        disabled={state === "correct"}
                        style={{ width: "100px" }}
                      />
                      {state !== "correct" && (
                        <button
                          className="btn-primary"
                          onClick={() => submitAnswer(problem)}
                          disabled={isSubmitting || inputVal.trim() === ""}
                        >
                          {isSubmitting
                            ? <span className="spinner" style={{ width: 16, height: 16 }} />
                            : "ส่ง"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Done banner */}
        {correctCount === totalCount && totalCount > 0 && (
          <div className="fade-up" style={{
            marginTop: "2rem", padding: "2rem",
            background: "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.05))",
            border: "2px solid var(--green-border)", borderRadius: "16px", textAlign: "center",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🎉</div>
            <h2 style={{ fontFamily: "Prompt, sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--green)" }}>
              ทำครบทุกข้อแล้ว!
            </h2>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
              คุณทำโจทย์ทั้ง {totalCount} ข้อถูกหมดแล้ว ยอดเยี่ยมมาก!
            </p>
            <Link href="/ranking">
              <button className="btn-primary" style={{ marginTop: "1rem", padding: "0.75rem 2rem" }}>
                ดูอันดับของฉัน 🏆
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
