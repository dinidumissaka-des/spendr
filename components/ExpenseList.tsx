"use client";

import { useState } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { deleteExpense, updateExpense } from "@/lib/supabase";
import { formatAmount } from "@/lib/currencies";
import type { Expense } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#9FE870",
  Transport:       "#00B67A",
  Shopping:        "#f5c85a",
  Entertainment:   "#f55adb",
  Health:          "#5a9cf5",
  Utilities:       "#f5885a",
  Travel:          "#a55af5",
  Education:       "#5af5a8",
};

const PRESET_CATEGORIES = Object.keys(CATEGORY_COLORS);

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "#717a68";
}


function formatDateLabel(dateStr: string) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AE", { weekday: "long", day: "numeric", month: "short" });
}

interface Props {
  expenses: Expense[];
  onDeleted: () => void;
  onUpdated: () => void;
  currency: string;
}

interface EditState {
  description: string;
  category: string;
  amount: string;
  date: string;
}

export default function ExpenseList({ expenses, onDeleted, onUpdated, currency }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setEditState({
      description: expense.description,
      category: expense.category,
      amount: String(expense.amount),
      date: expense.date,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState(null);
  }

  async function handleSave(id: string) {
    if (!editState) return;
    const parsed = parseFloat(editState.amount);
    if (!editState.description.trim() || isNaN(parsed) || parsed <= 0) return;

    setSaving(true);
    try {
      await updateExpense(id, {
        description: editState.description.trim(),
        category: editState.category,
        amount: parsed,
        date: editState.date,
      });
      setEditingId(null);
      setEditState(null);
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteExpense(id);
      onDeleted();
    } catch {
      // parent will re-fetch
    } finally {
      setDeletingId(null);
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-4xl mb-3">🪙</span>
        <p className="font-sans font-semibold text-lg text-muted">No expenses yet</p>
        <p className="font-sans text-sm text-muted mt-1">Add one above to get started.</p>
      </div>
    );
  }

  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    (acc[e.date] = acc[e.date] ?? []).push(e);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col gap-6">
      {sortedDates.map((date) => {
        const dayExpenses = grouped[date];
        const dayTotal = dayExpenses.reduce((s, e) => s + Number(e.amount), 0);

        return (
          <div key={date}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="font-mono text-xs text-muted uppercase tracking-widest">
                {formatDateLabel(date)}
              </span>
              <span className="font-mono text-xs text-muted">
                {currency} {formatAmount(dayTotal, currency)}
              </span>
            </div>

            <div className="bg-surface rounded-xl border border-border overflow-hidden divide-y divide-border shadow-sm">
              {dayExpenses.map((expense) => {
                const isEditing = editingId === expense.id;

                if (isEditing && editState) {
                  return (
                    <div key={expense.id} className="px-4 py-3 flex flex-col gap-3 bg-surface2">
                      <div className="flex gap-2">
                        <input
                          className="flex-1 bg-surface border border-border rounded-lg px-3 h-9 text-sm text-white placeholder:text-muted outline-none focus:border-accent"
                          value={editState.description}
                          onChange={(e) => setEditState({ ...editState, description: e.target.value })}
                          placeholder="Description"
                          autoFocus
                        />
                        <input
                          type="number"
                          className="w-28 bg-surface border border-border rounded-lg px-3 h-9 text-sm text-white outline-none focus:border-accent"
                          value={editState.amount}
                          onChange={(e) => setEditState({ ...editState, amount: e.target.value })}
                          placeholder="Amount"
                          min="0.01"
                          step="0.01"
                        />
                      </div>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 bg-surface border border-border rounded-lg px-3 h-9 text-sm text-white outline-none focus:border-accent appearance-none cursor-pointer"
                          value={editState.category}
                          onChange={(e) => setEditState({ ...editState, category: e.target.value })}
                        >
                          {PRESET_CATEGORIES.map((c) => (
                            <option key={c} value={c} className="bg-surface2">{c}</option>
                          ))}
                        </select>
                        <input
                          type="date"
                          className="w-36 bg-surface border border-border rounded-lg px-3 h-9 text-sm text-white outline-none focus:border-accent [color-scheme:dark]"
                          value={editState.date}
                          onChange={(e) => setEditState({ ...editState, date: e.target.value })}
                        />
                        <button
                          onClick={() => handleSave(expense.id)}
                          disabled={saving}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-accent text-[#163300] hover:bg-accent/85 disabled:opacity-50 flex-shrink-0"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-muted hover:text-white flex-shrink-0"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={expense.id}
                    className="group flex items-center gap-3 px-4 py-3.5 hover:bg-surface2 transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: categoryColor(expense.category) }}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-text text-sm font-sans truncate">{expense.description}</p>
                      <span
                        className="inline-block mt-0.5 text-xs font-mono px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${categoryColor(expense.category)}18`,
                          color: categoryColor(expense.category),
                        }}
                      >
                        {expense.category}
                      </span>
                    </div>

                    {expense.time && (
                      <span className="font-mono text-xs text-muted hidden sm:block flex-shrink-0">
                        {expense.time}
                      </span>
                    )}

                    <span className="font-mono text-sm text-white flex-shrink-0">
                      {currency} {formatAmount(Number(expense.amount), currency)}
                    </span>

                    {/* Edit */}
                    <button
                      onClick={() => startEdit(expense)}
                      aria-label="Edit expense"
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-white transition-all"
                    >
                      <Pencil size={13} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={deletingId === expense.id}
                      aria-label="Delete expense"
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-danger disabled:opacity-30 transition-all"
                    >
                      {deletingId === expense.id ? <span className="text-sm">…</span> : <Trash2 size={13} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
