"use client";

import { useState, useRef, FormEvent } from "react";
import { Plus, Loader2 } from "lucide-react";
import { addExpense } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePickerDrawer from "@/components/DatePickerDrawer";
import CategoryPicker from "@/components/CategoryPicker";
import GlassSurface from "@/components/GlassSurface";
import { CATEGORY_COLORS } from "@/lib/categories";

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
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setShowCategoryDrawer((v) => !v)}
          className={`h-[52px] flex items-center px-4 rounded-full border backdrop-blur-md text-sm text-white transition-colors ${
            showCategoryDrawer
              ? "border-white/25 bg-white/10"
              : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
          }`}
        >
          <span className="font-medium">{isCustom ? (customCategory.trim() || "Custom") : category}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowDateDrawer((v) => !v)}
          className={`h-[52px] flex items-center px-4 rounded-full border backdrop-blur-md text-sm text-white transition-colors ${
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
            setShowCategoryDrawer(false);
          }}
        />
      )}

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
    </GlassSurface>
  );
}
