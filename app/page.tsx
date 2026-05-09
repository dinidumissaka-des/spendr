"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { getExpensesByMonth, getSubscriptions, onAuthStateChange, signOut } from "@/lib/supabase";
import type { Expense, Subscription } from "@/types";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currencies";
import { useIsMobile } from "@/hooks/useIsMobile";
import AddExpenseForm from "@/components/expense/AddExpenseForm";
import GlassSurface from "@/components/GlassSurface";
import Logo from "@/components/Logo";
import AuthForm from "@/components/AuthForm";
import StatsBar from "@/components/StatsBar";
import BudgetBar from "@/components/BudgetBar";
import ExpenseList from "@/components/expense/ExpenseList";
import SubscriptionList from "@/components/subscription/SubscriptionList";
import BottomDrawer from "@/components/BottomDrawer";

type Filter = "all" | "today" | "week";
type View = "expenses" | "subscriptions";

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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("expenses");
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

  const fetchSubscriptions = useCallback(async () => {
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch {
      // silently fail; subscriptions are non-critical on load
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    if (user) fetchSubscriptions();
  }, [user, fetchSubscriptions]);

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

  const subscriptionsTotal = subscriptions.reduce((s, sub) => s + Number(sub.amount), 0);

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
            <div className="flex items-center gap-2">
              <button
                onClick={() => signOut()}
                aria-label="Sign out"
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.07] backdrop-blur-md text-white/40 hover:text-white/90 hover:border-white/[0.3] transition-colors"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>

          {/* Row 2: Currency + Month nav */}
          <div className="flex items-center gap-2 w-full justify-between">
            {/* Currency picker */}
            <div ref={currencyRef} className="relative">
              <button
                onClick={() => setShowCurrencyPicker((v) => !v)}
                className="flex items-center gap-1 h-8 px-3 rounded-full border border-white/[0.1] bg-white/[0.07] backdrop-blur-md text-white/40 hover:text-white/90 hover:border-white/[0.3] transition-colors text-xs font-mono"
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
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-sm transition-colors border-b border-white/10 last:border-0 ${
                    currency === c.code
                      ? "text-accent bg-accent/10"
                      : "text-white hover:bg-white/[0.07]"
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
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.07] backdrop-blur-md text-white/40 hover:text-white/90 hover:border-white/[0.3] transition-colors"
              >
                ‹
              </button>
              <span className="font-sans text-sm text-white font-medium min-w-[72px] text-center">
                {MONTH_NAMES[selectedMonth.month - 1]} {selectedMonth.year}
              </span>
              <button
                onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.07] backdrop-blur-md text-white/40 hover:text-white/90 hover:border-white/[0.3] transition-colors"
              >
                ›
              </button>
            </div>
          </div>
          {/* Row 3: View toggle (full width) */}
          <div className="flex items-center h-10 p-0.5 rounded-full border border-white/[0.1] bg-white/[0.07] backdrop-blur-md w-full">
            {(["expenses", "subscriptions"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 h-9 rounded-full text-sm font-mono transition-colors ${
                  view === v
                    ? "bg-white/15 text-white border border-white/15"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                {v === "expenses" ? "Expenses" : "Subscriptions"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <StatsBar expenses={expenses} selectedMonth={selectedMonth} currency={currency} subscriptionsTotal={subscriptionsTotal} />

        {/* Budget */}
        <BudgetBar spent={expenses.reduce((s, e) => s + Number(e.amount), 0) + subscriptionsTotal} currency={currency} />

        {view === "expenses" ? (
          <>
            {/* Add form */}
            <AddExpenseForm userId={user.id} currency={currency} onExpenseAdded={fetchExpenses} />

            {/* Filter tabs */}
            <GlassSurface borderRadius={28} backgroundOpacity={0.07}>
              <div className="flex gap-1 p-1 w-full">
                {filters.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`flex-1 py-2 text-sm font-mono rounded-full transition-colors ${
                      filter === key
                        ? "bg-white/10 backdrop-blur-md text-white font-semibold border border-white/15"
                        : "text-muted hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </GlassSurface>

            {/* Expense list / loading / error */}
            <div key={filter} className="animate-fade-slide-in">
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
          </>
        ) : (
          <SubscriptionList
            subscriptions={subscriptions}
            userId={user.id}
            currency={currency}
            onChanged={fetchSubscriptions}
          />
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
            <div className="h-3 w-16 bg-white/[0.07] rounded" />
            <div className="h-3 w-20 bg-white/[0.07] rounded" />
          </div>
          <div className="bg-white/[0.04] rounded-xl border border-white/[0.07] overflow-hidden divide-y divide-white/[0.08]">
            {[0, 1, 2].map((r) => (
              <div key={r} className="flex items-center gap-3 px-4 py-3">
                <div className="w-2.5 h-2.5 rounded-full bg-white/[0.07] flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 w-2/3 bg-white/[0.07] rounded" />
                  <div className="h-2.5 w-1/4 bg-white/[0.07] rounded-full" />
                </div>
                <div className="h-3 w-20 bg-white/[0.07] rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
