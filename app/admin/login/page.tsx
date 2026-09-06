"use client";

import { useActionState } from "react";
import { loginAdmin, type AdminLoginState } from "./actions";

const initialState: AdminLoginState = { error: null };

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAdmin,
    initialState
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#FFF5F0" }}
    >
      {/* Logo at top */}
      <div className="pt-8 pb-4 text-center">
        <h1
          className="text-xl font-semibold"
          style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
        >
          nudge <span style={{ color: "#6B9FE8" }}>admin</span>
        </h1>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <form action={formAction} className="space-y-4">
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              placeholder="Username"
              className="w-full px-6 py-4 rounded-2xl bg-white border-none focus:outline-none focus:ring-0 transition-all text-gray-700 shadow-md"
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                WebkitTapHighlightColor: "transparent",
                outline: "none",
              }}
            />
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              className="w-full px-6 py-4 rounded-2xl bg-white border-none focus:outline-none focus:ring-0 transition-all text-gray-700 shadow-md"
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                WebkitTapHighlightColor: "transparent",
                outline: "none",
              }}
            />

            {state.error && (
              <p className="text-sm px-1" style={{ color: "#dc2626" }}>
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-3 rounded-full font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-60 disabled:cursor-default cursor-pointer"
              style={{ background: "#6B9FE8", color: "white" }}
            >
              {isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
