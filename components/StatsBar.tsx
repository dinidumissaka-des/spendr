"use client";

import type { Expense } from "@/types";

interface Props {
  expenses: Expense[];
  selectedMonth: { year: number; month: number };
}

function formatAED(amount: number) {
  return `AED ${amount.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function StatsBar({ expenses, selectedMonth }: Props) {
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
    { label: isCurrentMonth ? "This Month" : "Month Total", value: formatAED(monthTotal), bar: "#9FE870", color: "#ffffff" },
    { label: "Today",        value: formatAED(todayTotal),  bar: "#00B67A", color: "#ffffff" },
    { label: "Transactions", value: String(expenses.length), bar: "#6b6b80", color: "#ffffff" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface rounded-xl border border-border pt-3 pb-4 px-4 flex flex-col gap-1"
        >
          <span className="font-sans text-xs text-muted uppercase tracking-widest font-semibold">
            {stat.label}
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold" style={{ color: stat.color }}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
