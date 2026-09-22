-- Controle de estoque multi-tenant do SelfPet.
-- Produtos são administrados por OWNER/ADMIN; movimentações passam por RPC
-- para manter saldo e histórico na mesma transação.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  description text not null default '',
  category text not null default '',
  sku text,
  unit text not null default 'UN',
  cost_price_cents integer not null default 0 check (cost_price_cents >= 0),
  sale_price_cents integer check (sale_price_cents is null or sale_price_cents >= 0),
  current_stock numeric(14,3) not null default 0 check (current_stock >= 0),
  minimum_stock numeric(14,3) not null default 0 check (minimum_stock >= 0),
  supplier text not null default '',
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists products_org_sku_unique
  on public.products (organization_id, lower(sku))
  where sku is not null and btrim(sku) <> '';

create index if not exists products_org_name_idx
  on public.products (organization_id, name);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  type text not null check (type in ('ENTRY','EXIT','ADJUSTMENT')),
  quantity numeric(14,3) not null check (quantity > 0),
  previous_stock numeric(14,3) not null check (previous_stock >= 0),
  new_stock numeric(14,3) not null check (new_stock >= 0),
  reason text not null default '',
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_org_product_date_idx
  on public.stock_movements (organization_id, product_id, created_at desc);

alter table public.products enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists products_select_member on public.products;
create policy products_select_member on public.products
  for select to authenticated
  using (private.role_in(organization_id) is not null);

drop policy if exists products_insert_admin on public.products;
create policy products_insert_admin on public.products
  for insert to authenticated
  with check (private.role_in(organization_id) in ('OWNER','ADMIN'));

drop policy if exists products_update_admin on public.products;
create policy products_update_admin on public.products
  for update to authenticated
  using (private.role_in(organization_id) in ('OWNER','ADMIN'))
  with check (private.role_in(organization_id) in ('OWNER','ADMIN'));

drop policy if exists products_delete_admin on public.products;
create policy products_delete_admin on public.products
  for delete to authenticated
  using (private.role_in(organization_id) in ('OWNER','ADMIN'));

drop policy if exists stock_movements_select_member on public.stock_movements;
create policy stock_movements_select_member on public.stock_movements
  for select to authenticated
  using (private.role_in(organization_id) is not null);

grant select, insert, update, delete on public.products to authenticated;
grant select on public.stock_movements to authenticated;

create or replace function public.move_stock(
  p_product uuid,
  p_type text,
  p_quantity numeric,
  p_reason text default '',
  p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  product_row public.products;
  member_role text;
  before_stock numeric(14,3);
  after_stock numeric(14,3);
  moved numeric(14,3);
  movement_id uuid;
begin
  if auth.uid() is null then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_type not in ('ENTRY','EXIT','ADJUSTMENT') then
    raise exception 'INVALID_MOVEMENT';
  end if;

  if p_quantity is null or p_quantity < 0 then
    raise exception 'INVALID_QUANTITY';
  end if;

  select * into product_row
  from public.products
  where id = p_product
  for update;

  if not found then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;

  member_role := private.role_in(product_row.organization_id);
  if member_role is null then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  before_stock := product_row.current_stock;

  if p_type = 'ENTRY' then
    if p_quantity <= 0 then raise exception 'INVALID_QUANTITY'; end if;
    after_stock := before_stock + p_quantity;
    moved := p_quantity;
  elsif p_type = 'EXIT' then
    if p_quantity <= 0 then raise exception 'INVALID_QUANTITY'; end if;
    if p_quantity > before_stock then
      raise exception 'INSUFFICIENT_STOCK';
    end if;
    after_stock := before_stock - p_quantity;
    moved := p_quantity;
  else
    after_stock := p_quantity;
    moved := abs(after_stock - before_stock);
    if moved = 0 then
      raise exception 'NO_STOCK_CHANGE';
    end if;
  end if;

  update public.products
  set current_stock = after_stock, updated_at = now()
  where id = product_row.id;

  insert into public.stock_movements (
    organization_id, product_id, type, quantity,
    previous_stock, new_stock, reason, notes, created_by
  ) values (
    product_row.organization_id, product_row.id, p_type, moved,
    before_stock, after_stock, coalesce(p_reason,''), coalesce(p_notes,''), auth.uid()
  )
  returning id into movement_id;

  return movement_id;
end;
$$;

revoke all on function public.move_stock(uuid,text,numeric,text,text) from public, anon;
grant execute on function public.move_stock(uuid,text,numeric,text,text) to authenticated;
