"use client";

import { useState, useRef, FormEvent } from "react";
import { Plus, Loader2 } from "lucide-react";
import { addExpense } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlassSurface from "@/components/GlassSurface";
import { CATEGORY_COLORS } from "@/lib/categories";

const PRESET_CATEGORIES = Object.keys(CATEGORY_COLORS);

interface Props {
  userId: string;
  currency: string;
  onExpenseAdded: () => void;
}

function formatDateLabel(iso: string) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (iso === today) return "Today";
  if (iso === yesterday) return "Yesterday";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

export default function AddExpenseForm({ userId, currency, onExpenseAdded }: Props) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/,/g, "");
    if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
    setAmount(raw);
    const parts = raw.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    setDisplayAmount(parts.join("."));
  }

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

      await addExpense({ description: description.trim(), category: effectiveCategory, amount: parsed, date, time }, userId);

      setDescription("");
      setCategory(PRESET_CATEGORIES[0]);
      setCustomCategory("");
      setAmount("");
      setDisplayAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onExpenseAdded();
    } catch {
      setError("Failed to add expense. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassSurface borderRadius={28} backgroundOpacity={0.07}>
    <div className="p-6 flex flex-col gap-5 w-full">
      {/* Hero amount input */}
      <div className="flex flex-col items-end gap-1 py-4">
        <span className="font-mono text-xs text-muted uppercase tracking-widest font-semibold">{currency}</span>
        <input
          ref={amountRef}
          type="text"
          inputMode="decimal"
          value={displayAmount}
          onChange={handleAmountChange}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="0.00"
          aria-label="Amount"
          className="w-full bg-transparent text-right text-6xl font-bold text-white placeholder:text-white/25 outline-none border-none focus-visible:outline-none"
        />
        <div className="h-px w-16 bg-white/[0.1] mt-1" />
      </div>

      {/* Description */}
      <Input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && amountRef.current?.focus()}
        placeholder="Lunch at Nando's"
      />

      {/* Category + Date row — native pickers overlaid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Category */}
        <div className="relative h-[52px] flex items-center justify-center px-4 rounded-full border border-white/10 bg-white/5 cursor-pointer overflow-hidden">
          <span className="font-medium text-sm text-white truncate pointer-events-none">
            {isCustom ? (customCategory.trim() || "Custom") : category}
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Category"
          >
            {PRESET_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="__custom__">Custom…</option>
          </select>
        </div>

        {/* Date */}
        <div className="relative h-[52px] flex items-center justify-center px-4 rounded-full border border-white/10 bg-white/5 cursor-pointer overflow-hidden">
          <span className="font-medium text-sm text-white pointer-events-none">
            {formatDateLabel(date)}
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Date"
          />
        </div>
      </div>

      {isCustom && (
        <Input
          type="text"
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
          placeholder="Enter category name"
          autoFocus
        />
      )}

      {error && <p className="text-danger text-sm">{error}</p>}
      {success && <p className="text-accent text-sm">Expense added!</p>}

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} strokeWidth={2.5} />}
        <span>{submitting ? "Adding…" : "Add Expense"}</span>
      </Button>
    </div>
    </GlassSurface>
  );
}
