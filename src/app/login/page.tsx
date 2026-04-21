"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
    } else {
      router.push("/problems");
      router.refresh();
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              background:
                "linear-gradient(135deg, #6c63ff, #63b3ff)",
              borderRadius: "16px",
              fontSize: "2rem",
              marginBottom: "1rem",
              boxShadow: "0 8px 32px rgba(108,99,255,0.4)",
            }}
          >
            ∑
          </div>
          <h1
            style={{
              fontFamily: "Prompt, sans-serif",
              fontSize: "2rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #6c63ff, #63b3ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            MathCheck
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            ฝึกทำโจทย์คณิตศาสตร์
          </p>
        </div>

        <div className="auth-card fade-up">
          <h2
            style={{
              fontFamily: "Prompt, sans-serif",
              fontSize: "1.3rem",
              fontWeight: 700,
              marginBottom: "1.5rem",
              color: "var(--text)",
            }}
          >
            เข้าสู่ระบบ
          </h2>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div>
              <label className="auth-label">อีเมล</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="auth-label">รหัสผ่าน</label>
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                style={{
                  background: "var(--red-bg)",
                  border: "1px solid var(--red-border)",
                  color: "var(--red)",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", padding: "0.875rem", fontSize: "1rem" }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--border)",
              color: "var(--text-muted)",
              fontSize: "0.9rem",
            }}
          >
            ยังไม่มีบัญชี?{" "}
            <Link
              href="/register"
              style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
