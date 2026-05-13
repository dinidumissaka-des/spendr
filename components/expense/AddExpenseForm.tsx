"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { addExpense } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePickerDrawer from "@/components/expense/DatePickerDrawer";
import CategoryPicker from "@/components/expense/CategoryPicker";
import GlassSurface from "@/components/GlassSurface";
import { CATEGORY_COLORS } from "@/lib/categories";
import { guessCategory } from "@/lib/categorize";

const PRESET_CATEGORIES = Object.keys(CATEGORY_COLORS);

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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSelected, setAiSelected] = useState(false);

  useEffect(() => {
    if (description.trim().length < 2) {
      setAiLoading(false);
      setAiSelected(false);
      return;
    }

    const keyword = guessCategory(description);
    if (keyword) {
      setCategory(keyword);
      setAiSelected(true);
      setAiLoading(false);
      return;
    }

    setAiLoading(true);
    setAiSelected(false);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description }),
        });
        if (res.ok) {
          const { category: suggested } = await res.json();
          if (suggested && PRESET_CATEGORIES.includes(suggested)) {
            setCategory(suggested);
            setAiSelected(true);
          }
        }
      } catch {
        // silently fail — user can pick manually
      } finally {
        setAiLoading(false);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [description]);

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
      setAiSelected(false);
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
          className="w-full bg-transparent text-right text-6xl font-bold text-white placeholder:text-white/25 outline-none border-none"
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
          placeholder="Lunch at Nando's"
        />
      </div>

      {/* Category + Date row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { setShowCategoryDrawer((v) => !v); setShowDateDrawer(false); }}
          className={`h-[52px] flex items-center justify-center gap-1.5 px-4 rounded-full border backdrop-blur-md text-sm text-white transition-colors ${
            showCategoryDrawer
              ? "border-white/25 bg-white/10"
              : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
          }`}
        >
          {aiLoading && <Loader2 size={12} className="animate-spin text-white/40 shrink-0" />}
          {!aiLoading && aiSelected && <Sparkles size={12} className="text-[#9FE870] shrink-0" />}
          <span className="font-medium truncate">{isCustom ? (customCategory.trim() || "Custom") : category}</span>
        </button>

        <button
          type="button"
          onClick={() => { setShowDateDrawer((v) => !v); setShowCategoryDrawer(false); }}
          className={`h-[52px] flex items-center justify-center px-4 rounded-full border backdrop-blur-md text-sm text-white transition-colors ${
            showDateDrawer
              ? "border-white/25 bg-white/10"
              : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
          }`}
        >
          <span className="font-medium">{date}</span>
        </button>
      </div>

      {showCategoryDrawer && (
        <CategoryPicker
          open={showCategoryDrawer}
          selected={category}
          isCustom={isCustom}
          onSelect={(cat) => {
            setCategory(cat);
            setAiSelected(false);
            setShowCategoryDrawer(false);
          }}
        />
      )}

      {showDateDrawer && (
        <DatePickerDrawer
          open={showDateDrawer}
          value={date}
          onChange={setDate}
          onClose={() => setShowDateDrawer(false)}
        />
      )}

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
    </GlassSurface>
  );
}
