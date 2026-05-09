# Spendr — Claude Project Context

## What this is
A mobile-first personal expense tracker PWA. Users log daily expenses and recurring subscriptions, track against a monthly budget, and switch currencies. Primary audience is mobile users.

## Tech stack
- **Framework**: Next.js 14 App Router, TypeScript, `"use client"` components throughout
- **Database + Auth**: Supabase (email/password auth, RLS on all tables)
- **Styling**: Tailwind CSS v3 — dark glass morphism design system
- **Background**: OGL/WebGL for LightRays animation
- **Icons**: lucide-react
- **PWA**: Custom service worker (`public/sw.js`), manifest (`app/manifest.ts`), install prompt

## Project structure
```
app/
  layout.tsx        Root layout — mounts LightRays, GrainOverlay, InstallPrompt, ServiceWorkerRegistration
  page.tsx          Main app — all top-level state (user, expenses, subscriptions, view, filter, currency)
  globals.css       CSS variables + Tailwind base
  manifest.ts       PWA manifest

components/
  background/       LightRays.tsx, GrainOverlay.tsx — purely visual, no business logic
  expense/          AddExpenseForm, ExpenseList, CategoryPicker, DatePickerDrawer
  subscription/     SubscriptionList — list + inline add/edit/delete
  ui/               Shadcn primitives — button, input, label only
  GlassSurface.tsx  Core reusable glass card (SVG displacement + backdrop-blur)
  BottomDrawer.tsx  Modal sheet — used for currency picker and date picker
  StatsBar.tsx      Month total (hero), Today, Avg/Day — includes subscriptionsTotal
  BudgetBar.tsx     Monthly budget progress bar
  AuthForm.tsx      Sign in / sign up
  Logo.tsx
  InstallPrompt.tsx
  ServiceWorkerRegistration.tsx

lib/
  supabase.ts       All DB + auth functions — expenses CRUD, subscriptions CRUD, auth
  categories.ts     CATEGORY_COLORS map — keys are the valid category names
  currencies.ts     CURRENCIES list, DEFAULT_CURRENCY, formatAmount()
  utils.ts          cn() — Tailwind class merging

hooks/
  useIsMobile.ts    640px breakpoint hook

types/
  index.ts          Expense, NewExpense, Subscription, NewSubscription
```

## Design system rules
- **Never** use `bg-surface`, `border-border`, `bg-surface2` — these CSS variables render as white in some contexts. Always use white-opacity utilities:
  - Backgrounds: `bg-white/[0.07]`, `bg-white/[0.04]`, `bg-white/10`
  - Borders: `border-white/[0.1]`, `border-white/[0.15]`
- **Accent**: `#9FE870` (rgb 159 232 112). Text on accent: `text-[#163300]`
- **Danger**: `rgb(224 92 92)` — `text-danger`, `border-danger/40`
- **Glass cards**: always use `<GlassSurface borderRadius={28} backgroundOpacity={0.07}>`, not raw divs
- **Inputs**: `bg-white/[0.07] border border-white/[0.1] rounded-lg px-3 text-white outline-none focus:border-white/30` — hide number spinners with `[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`
- **Pill buttons** (active state): `bg-white/10 backdrop-blur-md text-white font-semibold border border-white/15`
- **Rounded**: use `rounded-full` for filter tabs and toggle pills, `rounded-lg` for inputs, `borderRadius={28}` for GlassSurface cards
- **Font**: Manrope for everything. `font-mono` class still uses Manrope (overridden in tailwind.config.ts)
- **No comments** unless the WHY is non-obvious. No docstrings.

## Database schema
```sql
-- expenses
id uuid, user_id uuid, description text, category text, amount numeric,
date text (YYYY-MM-DD), time text (HH:MM AM/PM), created_at timestamptz

-- subscriptions
id uuid, user_id uuid, name text, amount numeric, category text,
billing_day integer default 1, created_at timestamptz
```
RLS enabled on both tables. `billing_day` exists in DB but is hidden from UI (hardcoded to 1).

## Key patterns
- **Inline category picker**: CategoryPicker renders inline (not in BottomDrawer) — toggle with a button's state
- **Hover-reveal actions**: edit/delete buttons use `w-0 group-hover:w-[60px] overflow-hidden transition-all duration-200` inside a `group` parent
- **onChanged callback**: SubscriptionList receives `onChanged: () => void` and calls it after any mutation to re-fetch
- **View state**: `view: "expenses" | "subscriptions"` lives in page.tsx. Expenses view shows AddExpenseForm + filter tabs + ExpenseList. Subscriptions view shows SubscriptionList only.
- **subscriptionsTotal**: calculated in page.tsx, passed to StatsBar and added to BudgetBar `spent`
