-- A conclusão e o histórico financeiro são gravados na mesma transação.
-- Os registros continuam sem permissão de escrita direta pelos clientes.
alter table public.service_records
  add column appointment_id uuid unique references public.appointments(id) on delete set null;
alter table public.service_records alter column employee_id drop not null;

create function private.sync_appointment_financial_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  record_id uuid;
  record_total integer;
  snapshot_service uuid;
  svc public.services;
begin
  -- RLS validates the appointment update; verify membership again before
  -- writing to the otherwise read-only financial history.
  if auth.uid() is null or private.role_in(new.organization_id) is null then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select id, total_cents into record_id, record_total
    from public.service_records
    where appointment_id = new.id and organization_id = new.organization_id
    for update;

  if new.status <> 'COMPLETED' then
    if record_id is not null then
      if exists (select 1 from public.payments where service_record_id = record_id and organization_id = new.organization_id) then
        raise exception 'APPOINTMENT_HAS_PAYMENTS';
      end if;
      update public.service_records set status = 'CANCELLED'
        where id = record_id and organization_id = new.organization_id and status <> 'CANCELLED';
    end if;
    return new;
  end if;

  if new.service_id is null then
    raise exception 'APPOINTMENT_SERVICE_REQUIRED';
  end if;

  if tg_op = 'UPDATE' and old.status = 'COMPLETED' and record_id is not null
    and row(new.service_id, new.starts_at, new.pet_id, new.customer_id, new.employee_id)
      is distinct from row(old.service_id, old.starts_at, old.pet_id, old.customer_id, old.employee_id) then
    raise exception 'APPOINTMENT_REOPEN_REQUIRED';
  end if;

  select * into svc from public.services
    where id = new.service_id and organization_id = new.organization_id
    for share;
  if not found then
    raise exception 'APPOINTMENT_SERVICE_REQUIRED';
  end if;

  if record_id is null then
    insert into public.service_records (
      organization_id, appointment_id, pet_id, customer_id, employee_id,
      performed_at, total_cents, notes, status, created_by
    ) values (
      new.organization_id, new.id, new.pet_id, new.customer_id, new.employee_id,
      new.starts_at, svc.price_cents, new.notes, 'COMPLETED', auth.uid()
    ) returning id into record_id;
  else
    select service_id into snapshot_service from public.service_record_services
      where service_record_id = record_id and organization_id = new.organization_id;
    -- Repeated completion preserves the original price, even if the catalog changes.
    if snapshot_service is distinct from new.service_id then
      record_total := svc.price_cents;
      delete from public.service_record_services
        where service_record_id = record_id and organization_id = new.organization_id;
    end if;
    update public.service_records set
      pet_id = new.pet_id, customer_id = new.customer_id, employee_id = new.employee_id,
      performed_at = new.starts_at, total_cents = record_total, notes = new.notes, status = 'COMPLETED'
      where id = record_id and organization_id = new.organization_id;
  end if;

  insert into public.service_record_services (
    organization_id, service_record_id, service_id, service_name, price_cents
  ) values (new.organization_id, record_id, svc.id, svc.name, svc.price_cents)
  on conflict (service_record_id, service_id) do nothing;
  return new;
end;
$$;

revoke all on function private.sync_appointment_financial_record() from public, anon, authenticated;

create trigger sync_appointment_financial_record
  after insert or update of status, service_id, starts_at, pet_id, customer_id, employee_id, notes
  on public.appointments
  for each row execute function private.sync_appointment_financial_record();
