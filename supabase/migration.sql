create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  category text not null,
  amount numeric(10, 2) not null,
  date date not null default current_date,
  time text,
  created_at timestamptz not null default now()
);

alter table expenses enable row level security;

-- Allow all operations (no auth for now)
create policy "allow all" on expenses for all using (true) with check (true);
