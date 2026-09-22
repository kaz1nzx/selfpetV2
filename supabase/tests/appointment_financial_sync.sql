-- Integration test: all fixtures, financial changes and audit rows are rolled back.
-- Run as postgres against a database containing an active member and a pet.
begin;
do $$
declare
  org uuid;
  actor uuid;
  pet uuid;
  customer uuid;
  svc uuid := gen_random_uuid();
  other_svc uuid := gen_random_uuid();
  appt uuid := gen_random_uuid();
  missing_service_appt uuid := gen_random_uuid();
  original_record uuid;
  baseline bigint;
  total bigint;
  affected integer;
begin
  select m.organization_id, m.user_id, p.id, p.customer_id into org, actor, pet, customer
    from public.organization_members m join public.pets p on p.organization_id = m.organization_id
    where m.active limit 1;
  if org is null then raise exception 'Test requires an active member and a pet'; end if;
  perform set_config('request.jwt.claim.sub', actor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub',actor,'role','authenticated')::text, true);

  insert into public.services(id, organization_id, name, price_cents)
    values (svc, org, 'Teste temporário: Tosa', 4000), (other_svc, org, 'Teste temporário: Banho', 5000);

  set local role authenticated;
  select coalesce(sum(total_cents),0) into baseline from public.service_records where organization_id=org and status='COMPLETED';
  insert into public.appointments(id,organization_id,customer_id,pet_id,service_id,starts_at,status)
    values(appt,org,customer,pet,svc,'2026-09-10T15:00:00Z','SCHEDULED');
  if exists(select 1 from public.service_records where appointment_id=appt) then raise exception 'Pending appointment produced income'; end if;

  update public.appointments set status='COMPLETED' where id=appt;
  select id into original_record from public.service_records where appointment_id=appt;
  if original_record is null then raise exception 'Completion did not create history'; end if;
  if not exists(select 1 from public.service_records where id=original_record and total_cents=4000 and status='COMPLETED' and employee_id is null and performed_at='2026-09-10T15:00:00Z') then raise exception 'Incorrect amount or report date'; end if;
  if not exists(select 1 from public.service_record_services where service_record_id=original_record and price_cents=4000 and service_name='Teste temporário: Tosa') then raise exception 'Missing service snapshot'; end if;
  select coalesce(sum(total_cents),0) into total from public.service_records where organization_id=org and status='COMPLETED';
  if total-baseline<>4000 then raise exception 'Dashboard did not increase by R$40'; end if;

  update public.appointments set status='COMPLETED' where id=appt;
  if (select count(*) from public.service_records where appointment_id=appt)<>1 then raise exception 'Duplicate income'; end if;
  reset role;
  update public.services set price_cents=8000 where id=svc;
  set local role authenticated;
  update public.appointments set status='COMPLETED',notes='Alteração sem duplicar' where id=appt;
  if (select total_cents from public.service_records where id=original_record)<>4000 then raise exception 'Catalog update changed historical price'; end if;

  begin
    update public.appointments set service_id=other_svc where id=appt;
    raise exception 'Completed service edit should fail';
  exception when others then
    if sqlerrm<>'APPOINTMENT_REOPEN_REQUIRED' then raise; end if;
  end;

  update public.appointments set status='SCHEDULED' where id=appt;
  select coalesce(sum(total_cents),0) into total from public.service_records where organization_id=org and status='COMPLETED';
  if total<>baseline then raise exception 'Reopening did not remove income'; end if;
  update public.appointments set status='COMPLETED' where id=appt;
  if (select id from public.service_records where appointment_id=appt)<>original_record then raise exception 'Recompletion created a new record'; end if;
  if (select total_cents from public.service_records where id=original_record)<>4000 then raise exception 'Recompletion changed the price'; end if;

  update public.appointments set status='SCHEDULED' where id=appt;
  update public.appointments set service_id=other_svc,status='COMPLETED' where id=appt;
  if (select total_cents from public.service_records where id=original_record)<>5000 then raise exception 'Changed service has wrong price'; end if;
  if (select count(*) from public.service_record_services where service_record_id=original_record)<>1 then raise exception 'Old service was counted twice'; end if;

  insert into public.appointments(id,organization_id,customer_id,pet_id,starts_at,status)
    values(missing_service_appt,org,customer,pet,'2026-09-10T15:00:00Z','SCHEDULED');
  begin
    update public.appointments set status='COMPLETED' where id=missing_service_appt;
    raise exception 'Completion without a service should fail';
  exception when others then
    if sqlerrm<>'APPOINTMENT_SERVICE_REQUIRED' then raise; end if;
  end;
  if (select status from public.appointments where id=missing_service_appt)<>'SCHEDULED' then raise exception 'Failed completion was not atomic'; end if;

  delete from public.appointments where id=appt;
  if not exists(select 1 from public.service_records where id=original_record and appointment_id is null and status='COMPLETED' and total_cents=5000) then raise exception 'Deleting calendar entry lost financial history'; end if;

  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  perform set_config('request.jwt.claims', '{"role":"authenticated"}', true);
  update public.appointments set status='COMPLETED' where id=missing_service_appt;
  get diagnostics affected = row_count;
  if affected<>0 then raise exception 'Non-member updated an appointment'; end if;
  reset role;
end;
$$;
rollback;
select 'PASS: R$40 income, snapshots, idempotence, reopening, service changes, atomicity and tenant isolation; all test data rolled back' as result;
