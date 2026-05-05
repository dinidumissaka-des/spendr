"use client";

import { useState, useRef, FormEvent } from "react";
import { Plus, Loader2, CalendarDays, ChevronDown } from "lucide-react";
import { addExpense } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePickerDrawer from "@/components/DatePickerDrawer";
import BottomDrawer from "@/components/BottomDrawer";
import { CATEGORY_COLORS } from "@/lib/categories";

const PRESET_CATEGORIES = [
  "Food & Dining",
  "Grocery",
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
  currency: string;
  onExpenseAdded: () => void;
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
  const [showDateDrawer, setShowDateDrawer] = useState(false);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);

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
    <div className="bg-surface rounded-2xl border border-border p-6 flex flex-col gap-5">
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
          className="w-full bg-transparent text-right text-6xl font-bold text-white placeholder:text-muted/40 outline-none border-none"
        />
        <div className="h-px w-16 bg-border mt-1" />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <Input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && amountRef.current?.focus()}
          placeholder="e.g. Lunch at Nando's"
        />
      </div>

      {/* Category + Date row */}
      <div className="flex gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <button
            type="button"
            onClick={() => setShowCategoryDrawer(true)}
            className="h-11 w-full rounded-xl border border-border bg-surface2 px-4 text-sm text-white flex items-center justify-between"
          >
            <span className="flex items-center gap-2 min-w-0">
              {!isCustom && (
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[category] ?? "#717a68" }}
                />
              )}
              <span className="truncate">{isCustom ? (customCategory.trim() || "Custom") : category}</span>
            </span>
            <ChevronDown size={14} className="text-muted flex-shrink-0 ml-1" />
          </button>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowDateDrawer(true)}
            className="h-11 rounded-xl border border-border bg-surface2 px-4 text-sm text-white flex items-center gap-2 whitespace-nowrap"
          >
            <span>{date}</span>
            <CalendarDays size={15} className="text-muted" />
          </button>
        </div>
      </div>

      <BottomDrawer
        open={showCategoryDrawer}
        onClose={() => setShowCategoryDrawer(false)}
        title="Select Category"
      >
        <div className="flex flex-wrap gap-2 px-4 py-5">
          {PRESET_CATEGORIES.map((c) => {
            const selected = category === c && !isCustom;
            const color = CATEGORY_COLORS[c] ?? "#717a68";
            return (
              <button
                key={c}
                onClick={() => { setCategory(c); setShowCategoryDrawer(false); }}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: selected ? color : `${color}22`,
                  color: selected ? "#163300" : color,
                }}
              >
                {c}
              </button>
            );
          })}
          <button
            onClick={() => { setCategory("__custom__"); setShowCategoryDrawer(false); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              isCustom ? "bg-white text-background border-white" : "border-border text-muted"
            }`}
          >
            Custom...
          </button>
        </div>
      </BottomDrawer>

      <DatePickerDrawer
        open={showDateDrawer}
        onClose={() => setShowDateDrawer(false)}
        value={date}
        onChange={setDate}
      />

      {isCustom && (
        <div className="flex flex-col gap-2">
          <Input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Enter category name"
            autoFocus
          />
        </div>
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
  );
}
