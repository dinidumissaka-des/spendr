"use client";

import { useState, useRef, FormEvent } from "react";
import { Plus, Loader2, CalendarDays, ChevronDown, Pencil } from "lucide-react";
import { addExpense } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  onExpenseAdded: () => void;
}

export default function AddExpenseForm({ userId, onExpenseAdded }: Props) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const [showDateDrawer, setShowDateDrawer] = useState(false);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);

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
      <h2 className="font-sans font-semibold text-lg text-white">Add Expense</h2>

      <div className="flex flex-col gap-2">
        <Label className="font-mono text-xs text-muted uppercase tracking-widest font-semibold">Description</Label>
        <Input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && amountRef.current?.focus()}
          placeholder="e.g. Lunch at Nando's"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="font-mono text-xs text-muted uppercase tracking-widest font-semibold">Category</Label>
        <button
          type="button"
          onClick={() => setShowCategoryDrawer(true)}
          className="h-11 w-full rounded-xl border border-border bg-surface2 px-4 text-sm text-white flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            {!isCustom && (
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[category] ?? "#717a68" }}
              />
            )}
            <span>{isCustom ? (customCategory.trim() || "Custom") : category}</span>
          </span>
          <ChevronDown size={14} className="text-muted" />
        </button>
        <BottomDrawer
          open={showCategoryDrawer}
          onClose={() => setShowCategoryDrawer(false)}
          title="Select Category"
        >
          {PRESET_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c); setShowCategoryDrawer(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors border-b border-border/50 last:border-0 ${
                category === c && !isCustom
                  ? "text-accent bg-accent/10"
                  : "text-white hover:bg-surface"
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[c] ?? "#717a68" }}
              />
              <span className="font-sans">{c}</span>
            </button>
          ))}
          <button
            onClick={() => { setCategory("__custom__"); setShowCategoryDrawer(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors ${
              isCustom ? "text-accent bg-accent/10" : "text-white hover:bg-surface"
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center border border-border">
              <Pencil size={8} className="text-muted" />
            </span>
            <span className="font-sans">Custom...</span>
          </button>
        </BottomDrawer>
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
          />
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex flex-col gap-2 flex-1">
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
          />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <Label className="font-mono text-xs text-muted uppercase tracking-widest font-semibold">Date</Label>
          <>
            <button
              type="button"
              onClick={() => setShowDateDrawer(true)}
              className="h-11 w-full rounded-xl border border-border bg-surface2 px-4 text-sm text-white flex items-center justify-between"
            >
              <span>{date}</span>
              <CalendarDays size={16} className="text-muted" />
            </button>
            <DatePickerDrawer
              open={showDateDrawer}
              onClose={() => setShowDateDrawer(false)}
              value={date}
              onChange={setDate}
            />
          </>
        </div>
      </div>

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
