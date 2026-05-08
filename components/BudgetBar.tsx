"use client";

import { useState, useEffect, useRef } from "react";
import { Pencil, Check, X } from "lucide-react";
import { formatAmount } from "@/lib/currencies";

interface Props {
  spent: number;
  currency: string;
}

export default function BudgetBar({ spent, currency }: Props) {
  const [budget, setBudget] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("spendr_budget");
    if (saved) setBudget(parseFloat(saved));
  }, []);

  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.focus(), 50);
  }, [editing]);

  function openEdit() {
    setInput(budget ? String(budget) : "");
    setEditing(true);
  }

  function save() {
    const parsed = parseFloat(input);
    if (!isNaN(parsed) && parsed > 0) {
      setBudget(parsed);
      localStorage.setItem("spendr_budget", String(parsed));
    }
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
  }

  if (!budget && !editing) {
    return (
      <button
        onClick={openEdit}
        className="w-full text-left bg-surface rounded-xl border border-border border-dashed px-4 py-3.5 text-sm text-muted hover:text-white hover:border-border transition-colors"
      >
        + Set a monthly budget
      </button>
    );
  }

  if (editing) {
    return (
      <div className="bg-surface rounded-xl border border-border px-4 py-3.5 flex items-center gap-3">
        <span className="font-mono text-xs text-muted flex-shrink-0">{currency}</span>
        <input
          ref={inputRef}
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          placeholder="0.00"
          className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button onClick={save} className="w-7 h-7 flex items-center justify-center rounded-lg bg-accent text-[#163300] flex-shrink-0">
          <Check size={13} />
        </button>
        <button onClick={cancel} className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted hover:text-white flex-shrink-0">
          <X size={13} />
        </button>
      </div>
    );
  }

  const percentage = Math.min((spent / budget!) * 100, 100);
  const over = spent > budget!;
  const remaining = budget! - spent;

  return (
    <div className="bg-surface rounded-xl border border-border px-4 py-3.5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs text-muted uppercase tracking-widest font-semibold">Monthly Budget</span>
        <button onClick={openEdit} className="text-muted hover:text-white transition-colors">
          <Pencil size={12} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-surface2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? "bg-danger" : "bg-accent"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Amounts */}
      <div className="flex items-center justify-between">
        <span className={`font-mono text-sm font-semibold ${over ? "text-danger" : "text-white"}`}>
          {formatAmount(spent, currency)}
          <span className="text-muted font-normal"> / {formatAmount(budget!, currency)}</span>
        </span>
        <span className={`font-mono text-xs ${over ? "text-danger" : "text-muted"}`}>
          {over
            ? `${formatAmount(spent - budget!, currency)} over`
            : `${formatAmount(remaining, currency)} left`}
        </span>
      </div>
    </div>
  );
}
