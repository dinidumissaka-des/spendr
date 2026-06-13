"use client";

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { Plus, Trash2, Check, X, Pencil, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Expense, Subscription, Income, NewIncome } from "@/types";
import { getExpensesByMonth, getIncomeByMonth, addIncome, deleteIncome, upsertUserSettings } from "@/lib/supabase";
import { formatAmount } from "@/lib/currencies";
import { CATEGORY_COLORS } from "@/lib/categories";
import GlassSurface from "@/components/GlassSurface";

interface Props {
  user: User;
  expenses: Expense[];
  subscriptions: Subscription[];
  selectedMonth: { year: number; month: number };
  currency: string;
  monthlyIncome: number | null;
  onMonthlyIncomeChange: (v: number | null) => void;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function daysElapsed(year: number, month: number) {
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  return isCurrentMonth ? Math.max(now.getDate(), 1) : daysInMonth(year, month);
}

function prevMonthOf(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

// ─── Category Chart ───────────────────────────────────────────────────────────

interface CategoryStat {
  category: string;
  amount: number;
  pct: number;
  color: string;
}

const OTHER_COLOR = "#ffffff33";

function buildCategoryStats(expenses: Expense[], subscriptions: Subscription[]): CategoryStat[] {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    map[e.category] = (map[e.category] ?? 0) + Number(e.amount);
  }
  for (const s of subscriptions) {
    map[s.category] = (map[s.category] ?? 0) + Number(s.amount);
  }
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      category,
      amount,
      pct: (amount / total) * 100,
      color: CATEGORY_COLORS[category] ?? OTHER_COLOR,
    }));
}

const CategoryChart = memo(function CategoryChart({
  expenses,
  subscriptions,
  currency,
}: {
  expenses: Expense[];
  subscriptions: Subscription[];
  currency: string;
}) {
  const stats = useMemo(() => buildCategoryStats(expenses, subscriptions), [expenses, subscriptions]);

  if (stats.length === 0) {
    return (
      <GlassSurface borderRadius={28} backgroundOpacity={0.07}>
        <div className="px-5 py-8 text-center w-full">
          <p className="text-muted text-sm font-mono">No spending data yet</p>
        </div>
      </GlassSurface>
    );
  }

  return (
    <GlassSurface borderRadius={28} backgroundOpacity={0.07}>
      <div className="px-5 py-4 flex flex-col gap-3 w-full">
        <span className="font-sans text-xs text-muted uppercase tracking-wider font-semibold">
          Spending by Category
        </span>
        <div className="flex flex-col gap-2.5">
          {stats.map(({ category, amount, pct, color }) => (
            <div key={category} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-sans text-xs text-white/70">{category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted">{pct.toFixed(0)}%</span>
                  <span className="font-mono text-xs text-white">{formatAmount(amount, currency)}</span>
                </div>
              </div>
              <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassSurface>
  );
});

// ─── Insight Cards ────────────────────────────────────────────────────────────

interface Insight {
  id: string;
  text: string;
  sub?: string;
  type: "neutral" | "positive" | "warning";
  icon?: React.ReactNode;
}

function buildInsights(
  expenses: Expense[],
  subscriptions: Subscription[],
  prevExpenses: Expense[],
  selectedMonth: { year: number; month: number },
  currency: string,
  monthlyIncome: number | null,
  budget: number | null,
): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === selectedMonth.year && now.getMonth() + 1 === selectedMonth.month;

  const stats = buildCategoryStats(expenses, subscriptions);
  const expTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const subTotal = subscriptions.reduce((s, s2) => s + Number(s2.amount), 0);
  const total = expTotal + subTotal;

  // 1. Top category
  if (stats.length > 0) {
    const top = stats[0];
    insights.push({
      id: "top-cat",
      text: `${top.category} is your biggest spend`,
      sub: `${top.pct.toFixed(0)}% of total — ${formatAmount(top.amount, currency)} ${currency}`,
      type: "neutral",
    });
  }

  // 2. Avg/day + projection (current month only)
  if (isCurrentMonth && expenses.length > 0) {
    const elapsed = daysElapsed(selectedMonth.year, selectedMonth.month);
    const totalDays = daysInMonth(selectedMonth.year, selectedMonth.month);
    const avgDay = expTotal / elapsed;
    const projected = avgDay * totalDays + subTotal;
    insights.push({
      id: "projection",
      text: `On track to spend ${formatAmount(projected, currency)} ${currency} this month`,
      sub: `Avg ${formatAmount(avgDay, currency)} ${currency}/day over ${elapsed} days`,
      type: projected > (budget ?? Infinity) ? "warning" : "neutral",
    });
  }

  // 3. Savings (if income set)
  if (monthlyIncome && monthlyIncome > 0) {
    const saved = monthlyIncome - total;
    const rate = (saved / monthlyIncome) * 100;
    if (saved >= 0) {
      insights.push({
        id: "savings",
        text: `You've saved ${formatAmount(saved, currency)} ${currency} this month`,
        sub: `${rate.toFixed(0)}% savings rate`,
        type: "positive",
        icon: <TrendingUp size={13} className="text-accent" />,
      });
    } else {
      insights.push({
        id: "overspend-income",
        text: `You're ${formatAmount(Math.abs(saved), currency)} ${currency} over your income`,
        sub: `Spending exceeds income by ${Math.abs(rate).toFixed(0)}%`,
        type: "warning",
        icon: <TrendingDown size={13} className="text-danger" />,
      });
    }
  }

  // 4. Category vs last month
  if (prevExpenses.length > 0 && stats.length > 0) {
    const prevMap: Record<string, number> = {};
    for (const e of prevExpenses) prevMap[e.category] = (prevMap[e.category] ?? 0) + Number(e.amount);
    const topCat = stats[0].category;
    const prev = prevMap[topCat] ?? 0;
    const curr = stats[0].amount;
    if (prev > 0) {
      const pctChange = ((curr - prev) / prev) * 100;
      const dir = pctChange > 0 ? "up" : "down";
      insights.push({
        id: "mom",
        text: `${topCat} is ${dir} ${Math.abs(pctChange).toFixed(0)}% from last month`,
        sub: `${formatAmount(prev, currency)} → ${formatAmount(curr, currency)} ${currency}`,
        type: pctChange > 15 ? "warning" : pctChange < -10 ? "positive" : "neutral",
        icon: pctChange > 0
          ? <TrendingUp size={13} className="text-danger" />
          : <TrendingDown size={13} className="text-accent" />,
      });
    }
  }

  // 5. Subscriptions summary
  if (subscriptions.length > 0) {
    insights.push({
      id: "subs",
      text: `${subscriptions.length} active subscription${subscriptions.length > 1 ? "s" : ""}`,
      sub: `${formatAmount(subTotal, currency)} ${currency}/month fixed cost`,
      type: "neutral",
      icon: <Minus size={13} className="text-muted" />,
    });
  }

  return insights;
}

const InsightCards = memo(function InsightCards({
  expenses,
  subscriptions,
  prevExpenses,
  selectedMonth,
  currency,
  monthlyIncome,
  budget,
}: {
  expenses: Expense[];
  subscriptions: Subscription[];
  prevExpenses: Expense[];
  selectedMonth: { year: number; month: number };
  currency: string;
  monthlyIncome: number | null;
  budget: number | null;
}) {
  const insights = useMemo(
    () => buildInsights(expenses, subscriptions, prevExpenses, selectedMonth, currency, monthlyIncome, budget),
    [expenses, subscriptions, prevExpenses, selectedMonth, currency, monthlyIncome, budget],
  );

  if (insights.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="px-1 font-sans text-xs text-muted uppercase tracking-wider font-semibold">
        Insights
      </span>
      <div className="flex flex-col gap-2">
        {insights.map((insight) => (
          <GlassSurface
            key={insight.id}
            borderRadius={20}
            backgroundOpacity={0.07}
            style={
              insight.type === "positive"
                ? { borderColor: "rgba(159,232,112,0.2)" }
                : insight.type === "warning"
                ? { borderColor: "rgba(224,92,92,0.2)" }
                : undefined
            }
          >
            <div className="px-4 py-3 flex items-start gap-3 w-full">
              {insight.icon && (
                <span className="mt-0.5 flex-shrink-0">{insight.icon}</span>
              )}
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="font-sans text-sm text-white leading-snug">{insight.text}</p>
                {insight.sub && (
                  <p className="font-mono text-xs text-muted">{insight.sub}</p>
                )}
              </div>
            </div>
          </GlassSurface>
        ))}
      </div>
    </div>
  );
});

// ─── Income Section ───────────────────────────────────────────────────────────

const INCOME_SOURCES = ["Salary", "Freelance", "Business", "Investment", "Rental", "Gift", "Other"];

const IncomeSection = memo(function IncomeSection({
  user,
  selectedMonth,
  currency,
  monthlyIncome,
  onMonthlyIncomeChange,
  expenses,
  subscriptions,
}: {
  user: User;
  selectedMonth: { year: number; month: number };
  currency: string;
  monthlyIncome: number | null;
  onMonthlyIncomeChange: (v: number | null) => void;
  expenses: Expense[];
  subscriptions: Subscription[];
}) {
  const [incomeEntries, setIncomeEntries] = useState<Income[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [editingBaseline, setEditingBaseline] = useState(false);
  const [baselineInput, setBaselineInput] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState("Salary");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [swipedIncomeId, setSwipedIncomeId] = useState<string | null>(null);
  const baselineRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const incomeTouchStartX = useRef(0);
  const incomeTouchStartY = useRef(0);

  useEffect(() => {
    if (editingBaseline) setTimeout(() => baselineRef.current?.focus(), 50);
  }, [editingBaseline]);

  useEffect(() => {
    if (showAddForm) setTimeout(() => amountRef.current?.focus(), 50);
  }, [showAddForm]);

  function handleIncomeTouchStart(e: React.TouchEvent) {
    incomeTouchStartX.current = e.touches[0].clientX;
    incomeTouchStartY.current = e.touches[0].clientY;
  }

  function handleIncomeTouchEnd(e: React.TouchEvent, entryId: string) {
    const deltaX = incomeTouchStartX.current - e.changedTouches[0].clientX;
    const deltaY = Math.abs(incomeTouchStartY.current - e.changedTouches[0].clientY);
    if (deltaY > 40) return;
    if (deltaX > 50) {
      if ("vibrate" in navigator) navigator.vibrate(18);
      setSwipedIncomeId(entryId);
    } else if (deltaX < -20) {
      setSwipedIncomeId(null);
    }
  }

  const fetchEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      const data = await getIncomeByMonth(selectedMonth.year, selectedMonth.month);
      setIncomeEntries(data);
    } catch { /* ignore */ } finally {
      setLoadingEntries(false);
    }
  }, [selectedMonth]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  function openBaselineEdit() {
    setBaselineInput(monthlyIncome ? String(monthlyIncome) : "");
    setEditingBaseline(true);
  }

  function saveBaseline() {
    const v = parseFloat(baselineInput);
    if (!isNaN(v) && v > 0) {
      onMonthlyIncomeChange(v);
      upsertUserSettings({ monthly_income: v }).catch(() => {});
    } else if (baselineInput === "" || baselineInput === "0") {
      onMonthlyIncomeChange(null);
      upsertUserSettings({ monthly_income: null }).catch(() => {});
    }
    setEditingBaseline(false);
  }

  async function handleAddEntry() {
    const parsed = parseFloat(newAmount);
    if (isNaN(parsed) || parsed <= 0 || !newDate) return;
    setSaving(true);
    try {
      await addIncome({ source: newSource, amount: parsed, date: newDate }, user.id);
      setNewAmount("");
      setNewDate(todayISO());
      setShowAddForm(false);
      fetchEntries();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEntry(id: string) {
    setDeletingId(id);
    try {
      await deleteIncome(id);
      fetchEntries();
    } catch { /* ignore */ } finally {
      setDeletingId(null);
    }
  }

  const entriesTotal = useMemo(
    () => incomeEntries.reduce((s, e) => s + Number(e.amount), 0),
    [incomeEntries],
  );
  const totalIncome = (monthlyIncome ?? 0) + entriesTotal;
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0)
    + subscriptions.reduce((s, s2) => s + Number(s2.amount), 0);
  const saved = totalIncome - totalSpent;
  const savingsRate = totalIncome > 0 ? (saved / totalIncome) * 100 : null;

  return (
    <div className="flex flex-col gap-3">
      <span className="px-1 font-sans text-xs text-muted uppercase tracking-wider font-semibold">
        Income & Savings
      </span>

      {/* Savings summary — show only if income set */}
      {totalIncome > 0 && (
        <GlassSurface
          borderRadius={28}
          backgroundOpacity={0.07}
          style={
            saved >= 0
              ? { borderColor: "rgba(159,232,112,0.25)", boxShadow: "0 0 10px rgba(159,232,112,0.05)" }
              : { borderColor: "rgba(224,92,92,0.25)" }
          }
        >
          <div className="px-5 py-4 w-full flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-muted uppercase tracking-wider font-semibold">
                Savings this month
              </span>
              {savingsRate !== null && (
                <span className={`font-mono text-xs font-semibold ${saved >= 0 ? "text-accent" : "text-danger"}`}>
                  {saved >= 0 ? "+" : ""}{savingsRate.toFixed(0)}%
                </span>
              )}
            </div>
            <div className="flex items-end justify-between">
              <span className={`font-mono text-2xl font-bold ${saved >= 0 ? "text-white" : "text-danger"}`}>
                {saved >= 0 ? "" : "-"}{formatAmount(Math.abs(saved), currency)}
                <span className="font-mono text-xs text-muted ml-1">{currency}</span>
              </span>
              <span className="font-mono text-xs text-muted">
                of {formatAmount(totalIncome, currency)} income
              </span>
            </div>
            {/* Savings bar */}
            {savingsRate !== null && (
              <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${saved >= 0 ? "bg-accent" : "bg-danger"}`}
                  style={{ width: `${Math.min(Math.abs(savingsRate), 100)}%` }}
                />
              </div>
            )}
          </div>
        </GlassSurface>
      )}

      {/* Monthly income baseline */}
      <GlassSurface borderRadius={28} backgroundOpacity={0.07}>
        {editingBaseline ? (
          <div className="px-4 py-3.5 flex items-center gap-3 w-full">
            <span className="font-mono text-xs text-muted flex-shrink-0">{currency}</span>
            <input
              ref={baselineRef}
              type="number"
              value={baselineInput}
              onChange={(e) => setBaselineInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveBaseline(); if (e.key === "Escape") setEditingBaseline(false); }}
              placeholder="Monthly income"
              className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button onClick={saveBaseline} aria-label="Save income" className="w-7 h-7 flex items-center justify-center rounded-lg bg-accent text-[#163300] flex-shrink-0">
              <Check size={13} />
            </button>
            <button onClick={() => setEditingBaseline(false)} aria-label="Cancel" className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.1] text-muted hover:text-white flex-shrink-0">
              <X size={13} />
            </button>
          </div>
        ) : monthlyIncome ? (
          <div className="px-4 py-3.5 flex items-center justify-between w-full">
            <div className="flex flex-col gap-0.5">
              <span className="font-sans text-xs text-muted uppercase tracking-wider font-semibold">Monthly Income</span>
              <span className="font-mono text-base text-white font-semibold">
                {formatAmount(monthlyIncome, currency)} <span className="text-muted text-xs font-normal">{currency}/mo</span>
              </span>
            </div>
            <button onClick={openBaselineEdit} aria-label="Edit monthly income" className="text-muted hover:text-white transition-colors">
              <Pencil size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={openBaselineEdit}
            className="w-full text-left px-4 py-3.5 text-sm text-muted hover:text-white transition-colors border border-dashed border-white/20 rounded-xl"
          >
            + Set monthly income baseline
          </button>
        )}
      </GlassSurface>

      {/* One-off income entries */}
      <GlassSurface borderRadius={28} backgroundOpacity={0.07}>
        <div className="w-full">
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.07]">
            <span className="font-sans text-xs text-muted uppercase tracking-wider font-semibold">One-off Income</span>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              aria-label="Add income entry"
              aria-expanded={showAddForm}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-accent text-[#163300]"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className="px-4 py-3 flex flex-col gap-2 border-b border-white/[0.07] bg-white/[0.03]">
              <div className="flex gap-2">
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="flex-1 bg-white/[0.07] border border-white/[0.1] rounded-lg px-3 h-9 text-sm text-white outline-none focus:border-white/30 appearance-none cursor-pointer"
                >
                  {INCOME_SOURCES.map((s) => (
                    <option key={s} value={s} className="bg-[#0a120a]">{s}</option>
                  ))}
                </select>
                <input
                  ref={amountRef}
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddEntry(); if (e.key === "Escape") setShowAddForm(false); }}
                  placeholder="Amount"
                  className="w-28 bg-white/[0.07] border border-white/[0.1] rounded-lg px-3 h-9 text-sm text-white outline-none focus:border-white/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="flex-1 bg-white/[0.07] border border-white/[0.1] rounded-lg px-3 h-9 text-sm text-white outline-none focus:border-white/30 [color-scheme:dark]"
                />
                <button
                  onClick={handleAddEntry}
                  disabled={saving}
                  aria-label="Save income entry"
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-accent text-[#163300] disabled:opacity-50 flex-shrink-0"
                >
                  <Check size={15} />
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  aria-label="Cancel"
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.1] text-muted hover:text-white flex-shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Entry list */}
          {loadingEntries ? (
            <div className="px-4 py-4 text-center">
              <span className="font-mono text-xs text-muted">Loading…</span>
            </div>
          ) : incomeEntries.length === 0 ? (
            <div className="px-4 py-4 text-center">
              <span className="font-mono text-xs text-muted">No one-off income logged</span>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.07]">
              {incomeEntries.map((entry) => {
                const isSwiped = swipedIncomeId === entry.id;
                return (
                  <div
                    key={entry.id}
                    className="relative overflow-hidden group"
                    onTouchStart={handleIncomeTouchStart}
                    onTouchEnd={(e) => handleIncomeTouchEnd(e, entry.id)}
                    onClick={() => { if (isSwiped) setSwipedIncomeId(null); }}
                  >
                    {/* Swipe reveal — mobile only */}
                    <div className={`absolute right-0 top-0 bottom-0 flex items-center px-2 sm:hidden transition-opacity duration-200 ${isSwiped ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                        disabled={deletingId === entry.id}
                        aria-label="Delete income entry"
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-danger/20 text-danger disabled:opacity-30"
                      >
                        {deletingId === entry.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                    {/* Row */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 transition-all duration-200"
                      style={{ transform: isSwiped ? "translateX(-56px)" : "translateX(0)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm text-white truncate">{entry.source}</p>
                        <p className="font-mono text-xs text-muted">{entry.date}</p>
                      </div>
                      <span className="font-mono text-sm text-accent font-semibold flex-shrink-0">
                        +{formatAmount(Number(entry.amount), currency)}
                      </span>
                      {/* Desktop hover delete */}
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        disabled={deletingId === entry.id}
                        aria-label="Delete income entry"
                        className="w-6 h-6 flex items-center justify-center rounded-md text-muted hover:text-danger opacity-0 group-hover:opacity-100 sm:flex hidden transition-all disabled:opacity-30 flex-shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {entriesTotal > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03]">
                  <span className="font-sans text-xs text-muted">One-off total</span>
                  <span className="font-mono text-xs text-accent font-semibold">
                    +{formatAmount(entriesTotal, currency)} {currency}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </GlassSurface>
    </div>
  );
});

// ─── Month-over-Month ─────────────────────────────────────────────────────────

const MomComparison = memo(function MomComparison({
  expenses,
  prevExpenses,
  subscriptions,
  currency,
  selectedMonth,
}: {
  expenses: Expense[];
  prevExpenses: Expense[];
  subscriptions: Subscription[];
  currency: string;
  selectedMonth: { year: number; month: number };
}) {
  const { year, month } = prevMonthOf(selectedMonth.year, selectedMonth.month);
  const prevLabel = new Date(year, month - 1, 1).toLocaleDateString("en", { month: "short", year: "2-digit" });

  const currMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of expenses) m[e.category] = (m[e.category] ?? 0) + Number(e.amount);
    for (const s of subscriptions) m[s.category] = (m[s.category] ?? 0) + Number(s.amount);
    return m;
  }, [expenses, subscriptions]);

  const prevMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of prevExpenses) m[e.category] = (m[e.category] ?? 0) + Number(e.amount);
    return m;
  }, [prevExpenses]);

  const categories = useMemo(() => {
    const allKeys = Object.keys(currMap).concat(Object.keys(prevMap));
    const seen = new Set<string>();
    const all = allKeys.filter((k) => { if (seen.has(k)) return false; seen.add(k); return true; });
    return all
      .map((cat) => ({
        cat,
        curr: currMap[cat] ?? 0,
        prev: prevMap[cat] ?? 0,
        color: CATEGORY_COLORS[cat] ?? OTHER_COLOR,
      }))
      .filter((r) => r.curr > 0 || r.prev > 0)
      .sort((a, b) => b.curr - a.curr)
      .slice(0, 6);
  }, [currMap, prevMap]);

  if (categories.length === 0) return null;

  return (
    <GlassSurface borderRadius={28} backgroundOpacity={0.07}>
      <div className="px-5 py-4 flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs text-muted uppercase tracking-wider font-semibold">
            vs Last Month
          </span>
          <span className="font-mono text-xs text-muted">{prevLabel}</span>
        </div>
        <div className="flex flex-col gap-2">
          {categories.map(({ cat, curr, prev, color }) => {
            const pctChange = prev > 0 ? ((curr - prev) / prev) * 100 : null;
            const isUp = curr > prev;
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="font-sans text-xs text-white/70 flex-1 truncate">{cat}</span>
                <span className="font-mono text-xs text-white flex-shrink-0">{formatAmount(curr, currency)}</span>
                {pctChange !== null ? (
                  <span className={`font-mono text-xs flex-shrink-0 w-14 text-right ${isUp ? "text-danger" : "text-accent"}`}>
                    {isUp ? "+" : ""}{pctChange.toFixed(0)}%
                  </span>
                ) : (
                  <span className="font-mono text-xs text-muted flex-shrink-0 w-14 text-right">new</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </GlassSurface>
  );
});

// ─── Main AnalyticsView ───────────────────────────────────────────────────────

export default function AnalyticsView({
  user,
  expenses,
  subscriptions,
  selectedMonth,
  currency,
  monthlyIncome,
  onMonthlyIncomeChange,
}: Props) {
  const [prevExpenses, setPrevExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<number | null>(null);

  useEffect(() => {
    const { year, month } = prevMonthOf(selectedMonth.year, selectedMonth.month);
    getExpensesByMonth(year, month)
      .then(setPrevExpenses)
      .catch(() => {});
  }, [selectedMonth]);

  // Read budget from localStorage for insight calculation
  useEffect(() => {
    const b = localStorage.getItem("minti_budget");
    if (b) setBudget(parseFloat(b));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <InsightCards
        expenses={expenses}
        subscriptions={subscriptions}
        prevExpenses={prevExpenses}
        selectedMonth={selectedMonth}
        currency={currency}
        monthlyIncome={monthlyIncome}
        budget={budget}
      />

      <CategoryChart expenses={expenses} subscriptions={subscriptions} currency={currency} />

      <MomComparison
        expenses={expenses}
        prevExpenses={prevExpenses}
        subscriptions={subscriptions}
        currency={currency}
        selectedMonth={selectedMonth}
      />

      <IncomeSection
        user={user}
        selectedMonth={selectedMonth}
        currency={currency}
        monthlyIncome={monthlyIncome}
        onMonthlyIncomeChange={onMonthlyIncomeChange}
        expenses={expenses}
        subscriptions={subscriptions}
      />
    </div>
  );
}
