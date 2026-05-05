"use client";

import { useState, useRef } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { deleteExpense, updateExpense } from "@/lib/supabase";
import { formatAmount } from "@/lib/currencies";
import { CATEGORY_COLORS } from "@/lib/categories";
import type { Expense } from "@/types";

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

const SWIPE_THRESHOLD = 72;

export default function ExpenseList({ expenses, onDeleted, onUpdated, currency }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const editPanelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const deletePanelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const touchStartX = useRef(0);
  const touchActiveId = useRef<string | null>(null);
  const touchDx = useRef(0);

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

  function resetPanels(id: string) {
    const ep = editPanelRefs.current[id];
    const dp = deletePanelRefs.current[id];
    if (ep) ep.style.opacity = "0";
    if (dp) dp.style.opacity = "0";
  }

  function snapBack(id: string) {
    const el = rowRefs.current[id];
    if (!el) return;
    // Spring curve for a satisfying bounce
    el.style.transition = "transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)";
    el.style.transform = "translateX(0)";
    resetPanels(id);
    touchActiveId.current = null;
    touchDx.current = 0;
  }

  function onTouchStart(e: React.TouchEvent, id: string) {
    touchStartX.current = e.touches[0].clientX;
    touchActiveId.current = id;
    touchDx.current = 0;
    const el = rowRefs.current[id];
    if (el) el.style.transition = "none";
  }

  function onTouchMove(e: React.TouchEvent, id: string) {
    if (touchActiveId.current !== id) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const clamped = Math.max(-110, Math.min(110, dx));
    touchDx.current = clamped;
    const el = rowRefs.current[id];
    if (el) el.style.transform = `translateX(${clamped}px)`;

    // Fade in the relevant action panel as swipe progresses
    const progress = Math.min(Math.abs(clamped) / SWIPE_THRESHOLD, 1);
    const ep = editPanelRefs.current[id];
    const dp = deletePanelRefs.current[id];
    if (clamped > 0) {
      if (ep) ep.style.opacity = String(progress);
      if (dp) dp.style.opacity = "0";
    } else {
      if (dp) dp.style.opacity = String(progress);
      if (ep) ep.style.opacity = "0";
    }
  }

  function onTouchEnd(id: string, expense: Expense) {
    const dx = touchDx.current;
    const el = rowRefs.current[id];

    if (dx > SWIPE_THRESHOLD) {
      // Slide off right then open edit
      if (el) {
        el.style.transition = "transform 200ms ease-in";
        el.style.transform = "translateX(110%)";
      }
      setTimeout(() => {
        if (el) { el.style.transition = "none"; el.style.transform = "translateX(0)"; }
        resetPanels(id);
        startEdit(expense);
      }, 200);
    } else if (dx < -SWIPE_THRESHOLD) {
      // Slide off left then delete
      if (el) {
        el.style.transition = "transform 200ms ease-in";
        el.style.transform = "translateX(-110%)";
      }
      resetPanels(id);
      setTimeout(() => handleDelete(id), 200);
    } else {
      snapBack(id);
    }
    touchActiveId.current = null;
    touchDx.current = 0;
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
            <div className="flex items-center gap-3 mb-2 px-1">
              <span className="font-mono text-xs text-muted uppercase tracking-widest whitespace-nowrap">
                {formatDateLabel(date)}
              </span>
              <div className="flex-1 h-px bg-border" />
              <span className="font-mono text-xs text-muted whitespace-nowrap">
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
                  <div key={expense.id} className="relative overflow-hidden">
                    {/* Edit action — revealed on right swipe */}
                    <div
                      ref={(el) => { editPanelRefs.current[expense.id] = el; }}
                      style={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center gap-2 pl-5 bg-accent/15"
                    >
                      <Pencil size={15} className="text-accent" />
                      <span className="text-xs font-semibold text-accent">Edit</span>
                    </div>
                    {/* Delete action — revealed on left swipe */}
                    <div
                      ref={(el) => { deletePanelRefs.current[expense.id] = el; }}
                      style={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-end gap-2 pr-5 bg-danger/15"
                    >
                      <span className="text-xs font-semibold text-danger">Delete</span>
                      <Trash2 size={15} className="text-danger" />
                    </div>

                    {/* Row */}
                    <div
                      ref={(el) => { rowRefs.current[expense.id] = el; }}
                      onTouchStart={(e) => onTouchStart(e, expense.id)}
                      onTouchMove={(e) => onTouchMove(e, expense.id)}
                      onTouchEnd={() => onTouchEnd(expense.id, expense)}
                      onTouchCancel={() => snapBack(expense.id)}
                      className="group relative flex items-center gap-3 px-4 py-3.5 bg-surface hover:bg-surface2 transition-colors"
                    >
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
                        {formatAmount(Number(expense.amount), currency)}
                      </span>

                      <button
                        onClick={() => startEdit(expense)}
                        aria-label="Edit expense"
                        className="hidden sm:flex opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 items-center justify-center rounded-md text-muted hover:text-white transition-all"
                      >
                        <Pencil size={13} />
                      </button>

                      <button
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId === expense.id}
                        aria-label="Delete expense"
                        className="hidden sm:flex opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 items-center justify-center rounded-md text-muted hover:text-danger disabled:opacity-30 transition-all"
                      >
                        {deletingId === expense.id ? <span className="text-sm">…</span> : <Trash2 size={13} />}
                      </button>
                    </div>
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
