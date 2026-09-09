"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setError(error.message);
      else setNotice("Check your inbox to confirm your email, then sign in.");
    }

    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-sm font-semibold text-white">
              L
            </span>
            <span className="text-lg font-semibold text-ink">
              LeadFinder India
            </span>
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            Verified local business leads, city by city.
          </p>
        </div>

        <div className="rounded-lg border border-panel-border bg-panel p-6">
          <div className="mb-6 flex rounded-md border border-panel-border p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("sign-in")}
              className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
                mode === "sign-in"
                  ? "bg-accent text-white"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("sign-up")}
              className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
                mode === "sign-up"
                  ? "bg-accent text-white"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
                className="w-full rounded-md border border-panel-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-md border border-panel-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent"
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-soft px-3 py-2 text-sm text-red">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-md bg-green-soft px-3 py-2 text-sm text-green">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {loading
                ? "Please wait…"
                : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-panel-border" />
            <span className="text-xs text-ink-faint">or</span>
            <div className="h-px flex-1 bg-panel-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-panel-border bg-white px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint">
          By continuing you agree to LeadFinder India&apos;s terms and privacy
          policy.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.5-5.9 7.7-11.3 7.7-6.9 0-12.5-5.6-12.5-12.5S17.1 10.3 24 10.3c3.2 0 6.1 1.2 8.3 3.2l5.1-5.1C34.1 5.3 29.3 3.4 24 3.4 12.7 3.4 3.4 12.7 3.4 24S12.7 44.6 24 44.6c11.3 0 20.6-9.3 20.6-20.6 0-1.2-.1-2.3-.3-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 5.9 4.3C13.8 15.5 18.5 12.3 24 12.3c3.2 0 6.1 1.2 8.3 3.2l5.1-5.1C34.1 7.3 29.3 5.4 24 5.4c-7.6 0-14.1 4.3-17.4 10.6z"
      />
      <path
        fill="#4CAF50"
        d="M24 44.6c5.2 0 9.9-1.8 13.6-4.9l-6.3-5.3c-2.1 1.5-4.8 2.4-7.6 2.4-5.3 0-9.8-3.3-11.4-8l-6.3 4.9c3.4 6.4 9.9 10.9 18 10.9z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.3 5.3C41.4 35.4 44.6 30.3 44.6 24c0-1.2-.1-2.3-.3-3.5z"
      />
    </svg>
  );
}
