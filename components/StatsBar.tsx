"use client";

import type { Expense } from "@/types";
import { formatAmount } from "@/lib/currencies";
import GlassSurface from "@/components/GlassSurface";

interface Props {
  expenses: Expense[];
  selectedMonth: { year: number; month: number };
  currency: string;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

interface Stat {
  label: string;
  value: string;
  hero: boolean;
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

  const stats: Stat[] = [
    { label: isCurrentMonth ? "This Month" : "Month Total", value: formatAmount(monthTotal, currency), hero: true },
    { label: "Today",  value: formatAmount(todayTotal, currency), hero: false },
    { label: "Txns",   value: String(expenses.length),           hero: false },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat) => (
        <GlassSurface
          key={stat.label}
          borderRadius={28}
          style={stat.hero ? { boxShadow: "0 0 12px rgba(159,232,112,0.07)", borderColor: "rgba(159,232,112,0.3)" } : undefined}
        >
          <div className="pt-4 pb-5 px-4 flex flex-col gap-2 w-full">
            <span className="font-sans text-xs text-muted uppercase tracking-widest font-semibold truncate leading-none">
              {stat.label}
            </span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-white leading-tight">
              {stat.value}
            </span>
          </div>
        </GlassSurface>
      ))}
    </div>
  );
}
