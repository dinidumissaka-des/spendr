"use client";

import { useEffect, useState } from "react";
import { X, Share, Plus } from "lucide-react";

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<Event & { prompt?: () => void } | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(true); // hidden until ready

  useEffect(() => {
    if (localStorage.getItem("spendr_install_dismissed")) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as Record<string, unknown>).MSStream;
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) return; // already installed

    if (ios) {
      setIsIOS(true);
      setDismissed(false);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as Event & { prompt?: () => void });
      setDismissed(false);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem("spendr_install_dismissed", "1");
    setDismissed(true);
  }

  async function install() {
    if (prompt?.prompt) {
      await prompt.prompt();
    }
    dismiss();
  }

  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 max-w-2xl mx-auto z-50 bg-surface2 border border-border rounded-2xl px-4 py-4 shadow-xl flex items-start gap-3 animate-fade-slide-in">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">Add Spendr to Home Screen</p>
        {isIOS ? (
          <p className="text-xs text-muted mt-1 flex items-center gap-1 flex-wrap">
            Tap <Share size={11} className="inline text-accent" /> then
            <span className="inline-flex items-center gap-0.5 text-accent">
              <Plus size={10} /> Add to Home Screen
            </span>
          </p>
        ) : (
          <p className="text-xs text-muted mt-1">Install for a faster, app-like experience</p>
        )}
      </div>
      {!isIOS && (
        <button
          onClick={install}
          className="flex-shrink-0 px-4 py-1.5 rounded-full bg-accent text-[#163300] text-xs font-semibold"
        >
          Install
        </button>
      )}
      <button onClick={dismiss} className="flex-shrink-0 text-muted hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>
  );
}
