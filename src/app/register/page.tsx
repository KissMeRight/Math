"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (username.length < 2) {
      setError("ชื่อผู้ใช้ต้องมีอย่างน้อย 2 ตัวอักษร");
      return;
    }

    setLoading(true);

    // Check username availability
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (existing) {
      setError("ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว");
      setLoading(false);
      return;
    }

    // Sign up
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
      return;
    }

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      username,
    });

    if (profileError) {
      setError("เกิดข้อผิดพลาดในการสร้างโปรไฟล์");
      setLoading(false);
      return;
    }

    router.push("/problems");
    router.refresh();
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
              background: "linear-gradient(135deg, #6c63ff, #63b3ff)",
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
        </div>

        <div className="auth-card fade-up">
          <h2
            style={{
              fontFamily: "Prompt, sans-serif",
              fontSize: "1.3rem",
              fontWeight: 700,
              marginBottom: "1.5rem",
            }}
          >
            สมัครสมาชิก
          </h2>

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label className="auth-label">ชื่อที่แสดง (Username)</label>
              <input
                className="auth-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())}
                placeholder="เช่น สมชาย123"
                required
                maxLength={30}
              />
            </div>

            <div>
              <label className="auth-label">อีเมล</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="auth-label">รหัสผ่าน</label>
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                required
              />
            </div>

            <div>
              <label className="auth-label">ยืนยันรหัสผ่าน</label>
              <input
                className="auth-input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
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
                  กำลังสมัคร...
                </span>
              ) : (
                "สมัครสมาชิก"
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
            มีบัญชีอยู่แล้ว?{" "}
            <Link
              href="/login"
              style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
