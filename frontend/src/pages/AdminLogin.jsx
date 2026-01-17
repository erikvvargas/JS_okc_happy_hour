import { useState } from "react";
import { setToken } from "../lib/auth";
import { API_BASE } from "../lib/api";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setErr("Wrong password");
      return;
    }
    const data = await res.json();
    setToken(data.token);
    window.location.href = "/admin";
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        <input
          className="w-full rounded border border-black/10 dark:border-white/10 bg-transparent p-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
        />
        {err ? <div className="text-sm text-red-500">{err}</div> : null}
        <button className="w-full rounded bg-black text-white dark:bg-white dark:text-black py-2">
          Sign in
        </button>
      </form>
    </div>
  );
}
