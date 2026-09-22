-- SelfPet — permissões de edição e exclusão para membros da organização.
-- Rode este arquivo no SQL Editor do Supabase se os botões de excluir/editar
-- não surtirem efeito (a interface mostra "sem permissão" nesse caso).
--
-- Observação: no Postgres, um DELETE bloqueado por RLS não gera erro — ele
-- apenas não afeta nenhuma linha. Por isso as server actions conferem quantas
-- linhas voltaram e avisam quando a política está faltando.

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.customers    to authenticated;
grant select, insert, update, delete on table public.pets         to authenticated;
grant select, insert, update, delete on table public.services     to authenticated;
grant select, insert, update, delete on table public.appointments to authenticated;

-- Helper: membro ativo da organização dona da linha.
create or replace function public.selfpet_is_member(target_organization uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = target_organization
      and member.user_id = auth.uid()
      and member.active = true
  );
$$;

grant execute on function public.selfpet_is_member(uuid) to authenticated;

-- customers
drop policy if exists "SelfPet members can update customers" on public.customers;
create policy "SelfPet members can update customers"
  on public.customers for update
  using (public.selfpet_is_member(organization_id))
  with check (public.selfpet_is_member(organization_id));

drop policy if exists "SelfPet members can delete customers" on public.customers;
create policy "SelfPet members can delete customers"
  on public.customers for delete
  using (public.selfpet_is_member(organization_id));

-- pets
drop policy if exists "SelfPet members can update pets" on public.pets;
create policy "SelfPet members can update pets"
  on public.pets for update
  using (public.selfpet_is_member(organization_id))
  with check (public.selfpet_is_member(organization_id));

drop policy if exists "SelfPet members can delete pets" on public.pets;
create policy "SelfPet members can delete pets"
  on public.pets for delete
  using (public.selfpet_is_member(organization_id));

-- services
drop policy if exists "SelfPet members can update services" on public.services;
create policy "SelfPet members can update services"
  on public.services for update
  using (public.selfpet_is_member(organization_id))
  with check (public.selfpet_is_member(organization_id));

drop policy if exists "SelfPet members can delete services" on public.services;
create policy "SelfPet members can delete services"
  on public.services for delete
  using (public.selfpet_is_member(organization_id));

-- appointments
drop policy if exists "SelfPet members can update appointments" on public.appointments;
create policy "SelfPet members can update appointments"
  on public.appointments for update
  using (public.selfpet_is_member(organization_id))
  with check (public.selfpet_is_member(organization_id));

drop policy if exists "SelfPet members can delete appointments" on public.appointments;
create policy "SelfPet members can delete appointments"
  on public.appointments for delete
  using (public.selfpet_is_member(organization_id));
