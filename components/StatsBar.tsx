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
    {
      label: isCurrentMonth ? "This Month" : "Month Total",
      value: formatAED(monthTotal),
      color: "#c8f55a",
    },
    {
      label: "Today",
      value: formatAED(todayTotal),
      color: "#5af5c8",
    },
    {
      label: "Transactions",
      value: String(expenses.length),
      color: "#f5c85a",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface rounded-xl border border-border pt-3 pb-4 px-4 flex flex-col gap-1"
          style={{ borderTop: `2px solid ${stat.color}` }}
        >
          <span className="font-mono text-xs text-muted uppercase tracking-widest">
            {stat.label}
          </span>
          <span
            className="font-serif text-xl sm:text-2xl text-text"
            style={{ color: stat.color }}
          >
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
