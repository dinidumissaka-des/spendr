"use client";

import { useState, useEffect, useCallback } from "react";
import { LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { getExpensesByMonth, onAuthStateChange, signOut } from "@/lib/supabase";
import type { Expense } from "@/types";
import AddExpenseForm from "@/components/AddExpenseForm";
import Logo from "@/components/Logo";
import AuthForm from "@/components/AuthForm";
import StatsBar from "@/components/StatsBar";
import ExpenseList from "@/components/ExpenseList";

type Filter = "all" | "today" | "week";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function Home() {
  const now = new Date();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(setUser);
    return () => subscription.unsubscribe();
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getExpensesByMonth(selectedMonth.year, selectedMonth.month);
      setExpenses(data);
    } catch {
      setFetchError("Could not load expenses. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  function prevMonth() {
    setSelectedMonth(({ year, month }) => {
      if (month === 1) return { year: year - 1, month: 12 };
      return { year, month: month - 1 };
    });
  }

  function nextMonth() {
    setSelectedMonth(({ year, month }) => {
      if (month === 12) return { year: year + 1, month: 1 };
      return { year, month: month + 1 };
    });
  }

  const filteredExpenses = expenses.filter((e) => {
    if (filter === "today") return e.date === todayISO();
    if (filter === "week") return e.date >= startOfWeekISO();
    return true;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
  ];

  if (user === undefined) {
    return (
      <main className="relative z-10 min-h-screen bg-background flex items-center justify-center">
        <span className="font-mono text-sm text-muted animate-pulse">Loading...</span>
      </main>
    );
  }

  if (user === null) {
    return (
      <main className="relative z-10 min-h-screen bg-background text-text">
        <div className="max-w-sm mx-auto px-4 py-20">
          <Logo className="h-7 w-auto mx-auto mb-8" />
          <AuthForm />
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 min-h-screen bg-background text-text">
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Logo className="h-7 w-auto" />

          <div className="flex items-center gap-3">
            {/* Month nav */}
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted hover:text-white hover:border-white transition-colors"
            >
              ‹
            </button>
            <span className="font-sans text-sm text-white font-medium min-w-[72px] text-center">
              {MONTH_NAMES[selectedMonth.month - 1]} {selectedMonth.year}
            </span>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted hover:text-white hover:border-white transition-colors"
            >
              ›
            </button>

            <button
              onClick={() => signOut()}
              aria-label="Sign out"
              className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted hover:text-danger hover:border-danger/50 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <StatsBar expenses={expenses} selectedMonth={selectedMonth} />

        {/* Add form */}
        <AddExpenseForm userId={user.id} onExpenseAdded={fetchExpenses} />

        {/* Filter tabs */}
        <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border shadow-sm">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-2 text-sm font-mono rounded-lg transition-colors ${
                filter === key
                  ? "bg-surface2 text-white font-semibold border border-border"
                  : "text-muted hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Expense list / loading / error */}
        {fetchError ? (
          <div className="bg-surface rounded-xl border border-danger/40 p-5 text-center">
            <p className="text-danger font-mono text-sm">{fetchError}</p>
            <button
              onClick={fetchExpenses}
              className="mt-3 text-xs font-mono text-muted underline hover:text-white"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <LoadingSkeleton />
        ) : (
          <ExpenseList expenses={filteredExpenses} onDeleted={fetchExpenses} onUpdated={fetchExpenses} />
        )}
      </div>
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {[0, 1].map((g) => (
        <div key={g}>
          <div className="flex justify-between mb-2 px-1">
            <div className="h-3 w-16 bg-surface2 rounded" />
            <div className="h-3 w-20 bg-surface2 rounded" />
          </div>
          <div className="bg-surface rounded-xl border border-border overflow-hidden divide-y divide-border">
            {[0, 1, 2].map((r) => (
              <div key={r} className="flex items-center gap-3 px-4 py-3">
                <div className="w-2.5 h-2.5 rounded-full bg-surface2 flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 w-2/3 bg-surface2 rounded" />
                  <div className="h-2.5 w-1/4 bg-surface2 rounded-full" />
                </div>
                <div className="h-3 w-20 bg-surface2 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
