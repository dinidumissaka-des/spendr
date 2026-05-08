"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { getExpensesByMonth, onAuthStateChange, signOut } from "@/lib/supabase";
import type { Expense } from "@/types";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currencies";
import { useIsMobile } from "@/hooks/useIsMobile";
import AddExpenseForm from "@/components/AddExpenseForm";
import Logo from "@/components/Logo";
import AuthForm from "@/components/AuthForm";
import StatsBar from "@/components/StatsBar";
import BudgetBar from "@/components/BudgetBar";
import ExpenseList from "@/components/ExpenseList";
import BottomDrawer from "@/components/BottomDrawer";

type Filter = "all" | "today" | "week";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Persist currency to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("spendr_currency");
    if (saved) setCurrency(saved);
  }, []);

  function selectCurrency(code: string) {
    setCurrency(code);
    localStorage.setItem("spendr_currency", code);
    setShowCurrencyPicker(false);
  }

  // Close picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setShowCurrencyPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
    { key: "all",   label: "All"       },
    { key: "today", label: "Today"     },
    { key: "week",  label: "This Week" },
  ];

  if (user === undefined) {
    return (
      <main className="relative z-10 min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm text-muted animate-pulse">Loading...</span>
      </main>
    );
  }

  if (user === null) {
    return (
      <main className="relative z-10 min-h-screen text-text">
        <div className="max-w-sm mx-auto px-4 py-20">
          <Logo className="h-7 w-auto mx-auto mb-8" />
          <AuthForm />
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 min-h-screen text-text">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-8 flex flex-col gap-2">

        {/* Header */}
        <div className="flex flex-col gap-5">
          {/* Row 1: Logo + Sign out */}
          <div className="flex items-center justify-between">
            <Logo className="h-7 w-auto" />
            <button
              onClick={() => signOut()}
              aria-label="Sign out"
              className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted hover:text-danger hover:border-danger/50 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>

          {/* Row 2: Currency + Month nav */}
          <div className="flex items-center gap-2 w-full justify-between">
            {/* Currency picker */}
            <div ref={currencyRef} className="relative">
              <button
                onClick={() => setShowCurrencyPicker((v) => !v)}
                className="flex items-center gap-1 h-8 px-3 rounded-full border border-border text-muted hover:text-white hover:border-white transition-colors text-xs font-mono"
              >
                {currency}
                <ChevronDown size={11} />
              </button>

            </div>

            <BottomDrawer
              open={showCurrencyPicker}
              onClose={() => setShowCurrencyPicker(false)}
              title="Select Currency"
            >
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => selectCurrency(c.code)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-sm transition-colors border-b border-border/50 last:border-0 ${
                    currency === c.code
                      ? "text-accent bg-accent/10"
                      : "text-white hover:bg-surface"
                  }`}
                >
                  <span className="font-mono font-semibold text-base">{c.code}</span>
                  <span className="text-sm text-muted">{c.name}</span>
                </button>
              ))}
            </BottomDrawer>

            {/* Month nav */}
            <div className="flex items-center gap-2">
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
            </div>
          </div>
        </div>

        {/* Stats */}
        <StatsBar expenses={expenses} selectedMonth={selectedMonth} currency={currency} />

        {/* Budget */}
        <BudgetBar spent={expenses.reduce((s, e) => s + Number(e.amount), 0)} currency={currency} />

        {/* Add form */}
        <AddExpenseForm userId={user.id} currency={currency} onExpenseAdded={fetchExpenses} />

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
        <div key={filter} className="mt-4 animate-fade-slide-in">
        {fetchError ? (
          <div className="bg-surface rounded-xl border border-danger/40 p-5 text-center">
            <p className="text-danger font-mono text-sm">{fetchError}</p>
            <button onClick={fetchExpenses} className="mt-3 text-xs font-mono text-muted underline hover:text-white">
              Retry
            </button>
          </div>
        ) : loading ? (
          <LoadingSkeleton />
        ) : (
          <ExpenseList
            expenses={filteredExpenses}
            onDeleted={fetchExpenses}
            onUpdated={fetchExpenses}
            currency={currency}
          />
        )}
        </div>
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
