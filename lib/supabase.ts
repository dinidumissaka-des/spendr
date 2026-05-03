import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { Expense, NewExpense } from '@/types';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    _client = createClient(url, key);
  }
  return _client;
}

export async function getExpensesByMonth(year: number, month: number): Promise<Expense[]> {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await getClient()
    .from('expenses')
    .select('*')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return getClient().auth.onAuthStateChange((_, session) => {
    callback(session?.user ?? null);
  });
}

export async function signUp(email: string, password: string) {
  const { data, error } = await getClient().auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await getClient().auth.signOut();
  if (error) throw error;
}

export async function addExpense(data: NewExpense, userId: string): Promise<Expense> {
  const { data: inserted, error } = await getClient()
    .from('expenses')
    .insert([{ ...data, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return inserted;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await getClient().from('expenses').delete().eq('id', id);
  if (error) throw error;
}
