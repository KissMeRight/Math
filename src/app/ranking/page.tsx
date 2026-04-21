"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type RankEntry = {
  user_id: string;
  username: string;
  correct_count: number;
  total_attempts: number;
  latest_submission: string | null;
};

export default function RankingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [totalProblems, setTotalProblems] = useState(0);
  const [currentUserId, setCurrentUserId] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRankings() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUserId(user.id);

      // Get current user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (profile) setUsername(profile.username);

      // Total problems count
      const { count } = await supabase
        .from("problems")
        .select("*", { count: "exact", head: true });
      setTotalProblems(count ?? 0);

      // Get all correct answers grouped by user
      const { data: answers } = await supabase
        .from("user_answers")
        .select("user_id, is_correct, attempt_count, submitted_at");

      // Get all profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username");

      if (!answers || !profiles) {
        setLoading(false);
        return;
      }

      // Aggregate per user
      const userMap = new Map<
        string,
        { correct: number; attempts: number; latest: string | null }
      >();

      answers.forEach((a) => {
        const cur = userMap.get(a.user_id) ?? {
          correct: 0,
          attempts: 0,
          latest: null,
        };
        if (a.is_correct) cur.correct++;
        cur.attempts += a.attempt_count ?? 1;
        if (
          !cur.latest ||
          (a.submitted_at && a.submitted_at > cur.latest)
        ) {
          cur.latest = a.submitted_at;
        }
        userMap.set(a.user_id, cur);
      });

      // Build ranking
      const profileMap = new Map(profiles.map((p) => [p.id, p.username]));

      const rankList: RankEntry[] = [];
      userMap.forEach((val, uid) => {
        const uname = profileMap.get(uid);
        if (uname) {
          rankList.push({
            user_id: uid,
            username: uname,
            correct_count: val.correct,
            total_attempts: val.attempts,
            latest_submission: val.latest,
          });
        }
      });

      // Sort: most correct first, then by latest submission (earlier = better)
      rankList.sort((a, b) => {
        if (b.correct_count !== a.correct_count)
          return b.correct_count - a.correct_count;
        // tie-break: fewer attempts is better
        if (a.total_attempts !== b.total_attempts)
          return a.total_attempts - b.total_attempts;
        return 0;
      });

      setRankings(rankList);
      setLoading(false);
    }

    loadRankings();
  }, [supabase, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const medals = ["🥇", "🥈", "🥉"];
  const rowClass = (idx: number) =>
    idx === 0 ? "top-1" : idx === 1 ? "top-2" : idx === 2 ? "top-3" : "";

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            className="spinner"
            style={{ width: 40, height: 40, borderWidth: 3 }}
          />
          <p style={{ color: "var(--text-muted)" }}>กำลังโหลดอันดับ...</p>
        </div>
      </div>
    );
  }

  const myRank = rankings.findIndex((r) => r.user_id === currentUserId) + 1;
  const myEntry = rankings.find((r) => r.user_id === currentUserId);

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Nav */}
      <nav className="nav">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            href="/problems"
            style={{
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            ← โจทย์
          </Link>
          <span
            style={{
              fontFamily: "Prompt, sans-serif",
              fontWeight: 800,
              fontSize: "1.2rem",
              background: "linear-gradient(135deg, #6c63ff, #63b3ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ∑ MathCheck
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              padding: "0.3rem 0.75rem",
              borderRadius: "20px",
              fontSize: "0.85rem",
              color: "var(--text-muted)",
            }}
          >
            👤 {username}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              padding: "0.3rem 0.75rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            ออกจากระบบ
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Header */}
        <div className="fade-up" style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontFamily: "Prompt, sans-serif",
              fontSize: "2rem",
              fontWeight: 800,
              marginBottom: "0.25rem",
            }}
          >
            🏆 ตารางอันดับ
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            โจทย์ทั้งหมด {totalProblems} ข้อ — อัปเดตแบบ realtime
          </p>
        </div>

        {/* My rank card */}
        {myEntry && (
          <div
            className="fade-up"
            style={{
              background: "linear-gradient(135deg, rgba(108,99,255,0.15), rgba(108,99,255,0.05))",
              border: "2px solid rgba(108,99,255,0.4)",
              borderRadius: "12px",
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                fontFamily: "Prompt, sans-serif",
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--accent)",
                minWidth: "60px",
                textAlign: "center",
              }}
            >
              #{myRank}
            </div>
            <div>
              <p style={{ fontWeight: 700, color: "var(--accent)" }}>
                อันดับของคุณ
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                ทำถูก {myEntry.correct_count} / {totalProblems} ข้อ
              </p>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <div
                style={{
                  background: "var(--accent)",
                  color: "white",
                  padding: "0.3rem 0.75rem",
                  borderRadius: "20px",
                  fontWeight: 700,
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "0.9rem",
                }}
              >
                {Math.round((myEntry.correct_count / totalProblems) * 100)}%
              </div>
            </div>
          </div>
        )}

        {/* Rankings list */}
        {rankings.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📊</div>
            <p>ยังไม่มีใครส่งคำตอบ เป็นคนแรกได้เลย!</p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
          >
            {rankings.map((entry, idx) => {
              const isMe = entry.user_id === currentUserId;
              const percent =
                totalProblems > 0
                  ? Math.round((entry.correct_count / totalProblems) * 100)
                  : 0;

              return (
                <div
                  key={entry.user_id}
                  className={`rank-row ${rowClass(idx)} fade-up`}
                  style={{
                    animationDelay: `${idx * 0.05}s`,
                    outline: isMe ? "2px solid var(--accent)" : "none",
                    outlineOffset: "2px",
                  }}
                >
                  {/* Rank */}
                  <div
                    style={{
                      textAlign: "center",
                      fontFamily: "Prompt, sans-serif",
                      fontWeight: 800,
                    }}
                  >
                    {idx < 3 ? (
                      <span style={{ fontSize: "1.5rem" }}>{medals[idx]}</span>
                    ) : (
                      <span
                        style={{
                          fontSize: "1.1rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        #{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Name + bar */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.3rem",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "1rem",
                          color: isMe ? "var(--accent)" : "var(--text)",
                        }}
                      >
                        {entry.username}
                      </span>
                      {isMe && (
                        <span
                          className="badge"
                          style={{
                            background: "var(--accent-glow)",
                            color: "var(--accent)",
                            border: "1px solid var(--accent)",
                            fontSize: "0.65rem",
                          }}
                        >
                          คุณ
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div
                        className="progress-bar"
                        style={{ width: "120px" }}
                      >
                        <div
                          className="progress-fill"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {entry.correct_count}/{totalProblems}
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "Prompt, sans-serif",
                        fontWeight: 800,
                        fontSize: "1.2rem",
                        color:
                          percent === 100
                            ? "var(--green)"
                            : percent >= 50
                            ? "var(--text)"
                            : "var(--text-muted)",
                      }}
                    >
                      {percent}%
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {entry.total_attempts} ครั้ง
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Link href="/problems">
            <button
              className="btn-primary"
              style={{ padding: "0.75rem 2rem" }}
            >
              ← กลับไปทำโจทย์
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
