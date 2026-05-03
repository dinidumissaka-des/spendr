"use client";

import { useState } from "react";
import { deleteExpense } from "@/lib/supabase";
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

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "#717a68";
}

function formatAED(amount: number) {
  return `AED ${Number(amount).toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
}

export default function ExpenseList({ expenses, onDeleted }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteExpense(id);
      onDeleted();
    } catch {
      // silently restore on error — parent will re-fetch
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

  // Group by date
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
            {/* Day header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="font-mono text-xs text-muted uppercase tracking-widest">
                {formatDateLabel(date)}
              </span>
              <span className="font-mono text-xs text-muted">
                {formatAED(dayTotal)}
              </span>
            </div>

            {/* Expense rows */}
            <div className="bg-surface rounded-xl border border-border overflow-hidden divide-y divide-border shadow-sm">
              {dayExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="group flex items-center gap-3 px-4 py-3.5 hover:bg-surface2 transition-colors"
                >
                  {/* Category dot */}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: categoryColor(expense.category) }}
                  />

                  {/* Description + category */}
                  <div className="flex-1 min-w-0">
                    <p className="text-text text-sm font-sans truncate">
                      {expense.description}
                    </p>
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

                  {/* Time */}
                  {expense.time && (
                    <span className="font-mono text-xs text-muted hidden sm:block flex-shrink-0">
                      {expense.time}
                    </span>
                  )}

                  {/* Amount */}
                  <span className="font-mono text-sm text-white flex-shrink-0">
                    {formatAED(Number(expense.amount))}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={deletingId === expense.id}
                    aria-label="Delete expense"
                    className="opacity-0 group-hover:opacity-100 ml-1 flex-shrink-0 text-muted hover:text-danger disabled:opacity-30 transition-all text-lg leading-none"
                  >
                    {deletingId === expense.id ? "…" : "×"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
