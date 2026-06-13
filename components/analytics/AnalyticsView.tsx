"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Expense, Subscription } from "@/types";
import { getExpensesByMonth } from "@/lib/supabase";
import { formatAmount } from "@/lib/currencies";
import { CATEGORY_COLORS } from "@/lib/categories";
import GlassSurface from "@/components/GlassSurface";

interface Props {
  expenses: Expense[];
  subscriptions: Subscription[];
  selectedMonth: { year: number; month: number };
  currency: string;
  monthlyIncome: number | null;
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

  if (stats.length > 0) {
    const top = stats[0];
    insights.push({
      id: "top-cat",
      text: `${top.category} is your biggest spend`,
      sub: `${top.pct.toFixed(0)}% of total — ${formatAmount(top.amount, currency)} ${currency}`,
      type: "neutral",
    });
  }

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

// ─── Main InsightsView ────────────────────────────────────────────────────────

export default function AnalyticsView({
  expenses,
  subscriptions,
  selectedMonth,
  currency,
  monthlyIncome,
}: Props) {
  const [prevExpenses, setPrevExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<number | null>(null);

  useEffect(() => {
    const { year, month } = prevMonthOf(selectedMonth.year, selectedMonth.month);
    getExpensesByMonth(year, month)
      .then(setPrevExpenses)
      .catch(() => {});
  }, [selectedMonth]);

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
    </div>
  );
}
