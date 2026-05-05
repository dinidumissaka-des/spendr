"use client";

import { Wallet, Zap, ReceiptText } from "lucide-react";
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
    { label: isCurrentMonth ? "This Month" : "Month Total", value: formatAmount(monthTotal, currency), icon: Wallet,      hero: true  },
    { label: "Today",                                        value: formatAmount(todayTotal, currency), icon: Zap,         hero: false },
    { label: "Txns",                                         value: String(expenses.length),            icon: ReceiptText, hero: false },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`rounded-xl border pt-3 pb-4 px-3 sm:px-4 flex flex-col gap-2 ${
              stat.hero
                ? "bg-surface border-accent/30 shadow-[0_0_12px_rgba(159,232,112,0.07)]"
                : "bg-surface border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-muted uppercase tracking-widest font-semibold truncate leading-none">
                {stat.label}
              </span>
              <Icon
                size={13}
                className={stat.hero ? "text-accent" : "text-muted"}
                strokeWidth={2.5}
              />
            </div>
            <span className="font-mono text-lg sm:text-2xl font-bold text-white leading-tight">
              {stat.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
