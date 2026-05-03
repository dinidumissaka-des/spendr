"use client";

import { useState, FormEvent } from "react";
import { signIn, signUp } from "@/lib/supabase";

export default function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signUpDone, setSignUpDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password);
        setSignUpDone(true);
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (signUpDone) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6 flex flex-col gap-3 text-center">
        <p className="font-serif text-lg text-text">Check your email</p>
        <p className="font-sans text-sm text-muted">
          We sent a confirmation link to <span className="text-text">{email}</span>.
          Click it to activate your account, then sign in.
        </p>
        <button
          onClick={() => { setMode("signin"); setSignUpDone(false); }}
          className="mt-2 text-xs font-mono text-accent underline hover:text-accent/80"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface rounded-xl border border-border p-6 flex flex-col gap-4"
    >
      <h2 className="font-serif text-xl text-text italic">
        {mode === "signin" ? "Sign in to Spendr" : "Create an account"}
      </h2>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs text-muted uppercase tracking-widest">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs text-muted uppercase tracking-widest">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {error && <p className="text-danger text-sm font-mono">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-accent text-background font-mono font-medium text-sm rounded-lg py-2.5 px-4 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "..." : mode === "signin" ? "Sign In" : "Sign Up"}
      </button>

      <p className="text-center text-xs font-mono text-muted">
        {mode === "signin" ? "No account?" : "Already have one?"}{" "}
        <button
          type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
          className="text-accent underline hover:text-accent/80"
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </form>
  );
}
