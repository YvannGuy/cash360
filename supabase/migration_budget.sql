-- Cash360 Budget & Suivi module
-- À exécuter dans l'onglet SQL de Supabase ou converti en migration officielle.
-- Cette migration définit deux tables reliées par utilisateur et par mois,
-- et active les politiques RLS nécessaires au module /dashboard/budget.

-- S'assurer que l'extension uuid est disponible
create extension if not exists "pgcrypto";

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  monthly_income numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint budgets_user_month_unique unique (user_id, month)
);

create table if not exists public.budget_expenses (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  category text not null,
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.budgets enable row level security;
alter table public.budget_expenses enable row level security;

-- Policies pour budgets (un utilisateur ne voit que ses lignes)
create policy "Users select their budgets" on public.budgets
  for select using (auth.uid() = user_id);

create policy "Users insert their budgets" on public.budgets
  for insert with check (auth.uid() = user_id);

create policy "Users update their budgets" on public.budgets
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete their budgets" on public.budgets
  for delete using (auth.uid() = user_id);

-- Policies pour budget_expenses (via appartenance au budget)
create policy "Users read expenses from owned budget" on public.budget_expenses
  for select using (
    exists (
      select 1 from public.budgets b
      where b.id = budget_expenses.budget_id
        and b.user_id = auth.uid()
    )
  );

create policy "Users insert expenses into owned budget" on public.budget_expenses
  for insert with check (
    exists (
      select 1 from public.budgets b
      where b.id = budget_expenses.budget_id
        and b.user_id = auth.uid()
    )
  );

create policy "Users update expenses from owned budget" on public.budget_expenses
  for update using (
    exists (
      select 1 from public.budgets b
      where b.id = budget_expenses.budget_id
        and b.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.budgets b
      where b.id = budget_expenses.budget_id
        and b.user_id = auth.uid()
    )
  );

create policy "Users delete expenses from owned budget" on public.budget_expenses
  for delete using (
    exists (
      select 1 from public.budgets b
      where b.id = budget_expenses.budget_id
        and b.user_id = auth.uid()
    )
  );

-- Remarque : l'application met à jour updated_at lors des upserts.
