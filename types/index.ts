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
