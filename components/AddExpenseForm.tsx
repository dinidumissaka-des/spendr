"use client";

import { useState, useRef, FormEvent } from "react";
import { addExpense } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRESET_CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Utilities",
  "Travel",
  "Education",
];

interface Props {
  userId: string;
  onExpenseAdded: () => void;
}

export default function AddExpenseForm({ userId, onExpenseAdded }: Props) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const isCustom = category === "__custom__";
  const effectiveCategory = isCustom ? customCategory.trim() : category;

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!description.trim() || !effectiveCategory || !amount) {
      setError("Please fill in all fields.");
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const now = new Date();
      const hours = now.getHours();
      const mins = String(now.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const h12 = String(hours % 12 || 12);
      const time = `${h12}:${mins} ${ampm}`;
      const date = now.toISOString().split("T")[0];

      await addExpense({ description: description.trim(), category: effectiveCategory, amount: parsed, date, time }, userId);

      setDescription("");
      setCategory(PRESET_CATEGORIES[0]);
      setCustomCategory("");
      setAmount("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onExpenseAdded();
    } catch {
      setError("Failed to add expense. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "";

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 flex flex-col gap-5">
      <h2 className="font-sans font-semibold text-lg text-white">Add Expense</h2>

      <div className="flex flex-col gap-2">
        <Label className="font-mono text-xs text-muted uppercase tracking-widest font-semibold">Description</Label>
        <Input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && amountRef.current?.focus()}
          placeholder="e.g. Lunch at Nando's"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="font-mono text-xs text-muted uppercase tracking-widest font-semibold">Category</Label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-surface2 border border-border rounded-lg px-3 h-11 text-white text-base focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer w-full"
        >
          {PRESET_CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-surface2">{c}</option>
          ))}
          <option value="__custom__" className="bg-surface2">Custom...</option>
        </select>
      </div>

      {isCustom && (
        <div className="flex flex-col gap-2">
          <Label className="font-mono text-xs text-muted uppercase tracking-widest font-semibold">Custom Category</Label>
          <Input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Enter category name"
            autoFocus
            className={inputClass}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label className="font-mono text-xs text-muted uppercase tracking-widest font-semibold">Amount (AED)</Label>
        <Input
          ref={amountRef}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="0.00"
          min="0.01"
          step="0.01"
          className={inputClass}
        />
      </div>

      {error && <p className="text-danger text-sm font-mono">{error}</p>}
      {success && <p className="text-accent text-sm font-mono">Expense added!</p>}

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full"
      >
        {submitting ? "Adding..." : "Add Expense"}
      </Button>
    </div>
  );
}
