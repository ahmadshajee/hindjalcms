"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = "/";
      } else {
        setError(data.error || "Login failed.");
      }
    } catch (err) {
      setError("Unable to reach authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      {/* Decorative Orbs for background depth */}
      <div className="login-orb login-orb--blue" />
      <div className="login-orb login-orb--earth" />

      <div className="login-panel panel fade-in">
        <header className="login-header">
          <span className="badge badge--info">Admin Console</span>
          <h1>Sign In</h1>
          <p className="panel-note">Enter your admin credentials to access the Hind Jal CMS.</p>
        </header>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field" data-span="2">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="admin@test.com"
              style={{ fontSize: "0.95rem" }}
            />
          </div>

          <div className="field" data-span="2">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              style={{ fontSize: "0.95rem" }}
            />
          </div>

          {error && (
            <div className="status status--error" style={{ gridColumn: "span 2", marginTop: "0.5rem" }}>
              {error}
            </div>
          )}

          <div className="form-actions" style={{ gridColumn: "span 2", marginTop: "1rem" }}>
            <button type="submit" className="btn btn--primary" style={{ width: "100%", padding: "0.85rem 1rem", fontSize: "0.95rem" }} disabled={loading}>
              {loading ? "Signing in..." : "Sign In to CMS"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
