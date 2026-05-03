"use client";

import { useState, FormEvent } from "react";
import { signIn, signUp } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  const inputClass = "";

  if (signUpDone) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-8 flex flex-col gap-3 text-center">
        <p className="font-sans font-semibold text-xl text-white">Check your email</p>
        <p className="font-sans text-base text-muted">
          We sent a confirmation link to <span className="text-white font-medium">{email}</span>.
        </p>
        <button
          onClick={() => { setMode("signin"); setSignUpDone(false); }}
          className="mt-2 text-sm font-mono text-accent underline hover:text-accent/80"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-border p-8 flex flex-col gap-5">
      <h2 className="font-sans font-semibold text-2xl text-white">
        {mode === "signin" ? "Sign in" : "Create an account"}
      </h2>

      <div className="flex flex-col gap-2">
        <Label className="font-mono text-xs text-muted uppercase tracking-widest font-semibold">Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="font-mono text-xs text-muted uppercase tracking-widest font-semibold">Password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      {error && <p className="text-danger text-sm font-mono">{error}</p>}

      <Button
        type="submit"
        disabled={submitting}
        className="w-full"
      >
        {submitting ? "..." : mode === "signin" ? "Sign In" : "Sign Up"}
      </Button>

      <p className="text-center text-sm font-mono text-muted">
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
