create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null check (type in ('INCOME', 'EXPENSE')),
  description text not null,
  category text not null,
  amount_cents integer not null check (amount_cents > 0),
  created_at timestamptz not null default now()
);

grant usage on schema public to authenticated;
grant select, insert, delete on table public.financial_transactions to authenticated;

alter table public.financial_transactions enable row level security;

drop policy if exists "Members can read organization transactions" on public.financial_transactions;
drop policy if exists "Members can create organization transactions" on public.financial_transactions;
drop policy if exists "Members can delete organization transactions" on public.financial_transactions;

create policy "Members can read organization transactions"
  on public.financial_transactions for select
  using (exists (
    select 1 from public.organization_members member
    where member.organization_id = financial_transactions.organization_id
      and member.user_id = auth.uid()
      and member.active = true
  ));

create policy "Members can create organization transactions"
  on public.financial_transactions for insert
  with check (exists (
    select 1 from public.organization_members member
    where member.organization_id = financial_transactions.organization_id
      and member.user_id = auth.uid()
      and member.active = true
  ));

create policy "Members can delete organization transactions"
  on public.financial_transactions for delete
  using (exists (
    select 1 from public.organization_members member
    where member.organization_id = financial_transactions.organization_id
      and member.user_id = auth.uid()
      and member.active = true
  ));
