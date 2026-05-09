"use client";

import { useState, FormEvent } from "react";
import { signIn, signUp } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";

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
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 gap-3 text-center sm:min-h-0 sm:bg-white/[0.07] sm:rounded-2xl sm:border sm:border-white/[0.1] sm:p-8">
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
    <form
      onSubmit={handleSubmit}
      className="flex flex-col min-h-[100dvh] px-6 pt-16 pb-10 sm:min-h-0 sm:bg-white/[0.07] sm:rounded-2xl sm:border sm:border-white/[0.1] sm:p-8 sm:gap-5"
    >
      {/* Logo + title */}
      <div className="flex items-center gap-3">
        <Logo className="h-5 w-auto flex-shrink-0" />
        <span className="text-white/20">•</span>
        <h2 className="font-sans font-semibold text-xl text-white">
          {mode === "signin" ? "Sign in" : "Sign up"}
        </h2>
      </div>

      {/* Inputs — vertically centered on mobile, normal flow on desktop */}
      <div className="flex-1 flex flex-col justify-center gap-5 sm:flex-none">
        <div className="flex flex-col gap-2">
          <Label className="font-mono text-xs text-muted uppercase tracking-widest font-semibold">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="font-mono text-xs text-muted uppercase tracking-widest font-semibold">Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-danger text-sm font-mono">{error}</p>}
      </div>

      {/* CTA — pinned to bottom on mobile, normal flow on desktop */}
      <div className="flex flex-col gap-4">
        <Button type="submit" disabled={submitting} className="w-full">
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
      </div>
    </form>
  );
}
