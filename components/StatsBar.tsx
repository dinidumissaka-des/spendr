"use client";

import type { Expense } from "@/types";
import { formatAmount } from "@/lib/currencies";

interface Props {
  expenses: Expense[];
  selectedMonth: { year: number; month: number };
  currency: string;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function StatsBar({ expenses, selectedMonth, currency }: Props) {
  const today = todayISO();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const isCurrentMonth =
    selectedMonth.month === currentMonth && selectedMonth.year === currentYear;

  const monthTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const todayTotal = expenses
    .filter((e) => e.date === today)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const stats = [
    { label: isCurrentMonth ? "This Month" : "Month Total", value: formatAmount(monthTotal, currency) },
    { label: "Today", value: formatAmount(todayTotal, currency) },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface rounded-xl border border-border pt-5 pb-6 px-5 flex flex-col gap-2">
          <span className="font-sans text-xs text-muted uppercase tracking-widest font-semibold truncate leading-none">
            {stat.label}
          </span>
          <span className="font-mono text-2xl sm:text-3xl font-bold text-white leading-tight">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
