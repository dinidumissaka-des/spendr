export type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string; // ISO date string YYYY-MM-DD
  time: string; // HH:MM AM/PM
  created_at: string;
};

export type NewExpense = Omit<Expense, 'id' | 'created_at'>;

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  category: string;
  billing_day: number;
  created_at: string;
};

export type NewSubscription = Omit<Subscription, 'id' | 'created_at'>;
