-- SelfPet: permite leitura do painel global para administradores cadastrados
-- em private.saas_admins sem exigir MFA. Operações críticas continuam protegidas
-- pela função private.admin_subscription(), que mantém is_saas_admin(true).

create or replace function private.admin_organizations(p_page integer, p_search text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
begin
 if not private.is_saas_admin(false) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if p_page<1 or p_page>100000 or length(p_search)>120 then raise exception 'INVALID_INPUT'; end if;
 return jsonb_build_object('count',(select count(*) from public.organizations where name ilike '%'||p_search||'%'),
 'rows',coalesce((select jsonb_agg(x) from (select o.id,o.name,o.email,o.pet_count,o.created_at,s.id as subscription_id,s.plan,s.status,s.expires_at,case when s.plan<>'FREE' and s.status='ACTIVE' and s.expires_at<=clock_timestamp() then 'EXPIRED' else s.status::text end as effective_status from public.organizations o join public.subscriptions s on s.organization_id=o.id where o.name ilike '%'||p_search||'%' order by o.created_at desc limit 20 offset (p_page-1)*20) x),'[]'::jsonb));
end $function$;

create or replace function private.admin_organization(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
begin
 if not private.is_saas_admin(false) then raise exception 'FORBIDDEN' using errcode='42501';end if;
 return (select to_jsonb(x) from (select o.id,o.name,o.email,o.pet_count,o.created_at,s.id as subscription_id,s.plan,s.status,s.expires_at,case when s.plan<>'FREE' and s.status='ACTIVE' and s.expires_at<=clock_timestamp() then 'EXPIRED' else s.status::text end as effective_status from public.organizations o join public.subscriptions s on s.organization_id=o.id where o.id=p_id)x);
end $function$;

create or replace function private.admin_history(p_org uuid, p_page integer)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
begin
 if not private.is_saas_admin(false) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if p_page is null or p_page<1 or p_page>100000 then raise exception 'INVALID_INPUT'; end if;
 return jsonb_build_object('count',(select count(*) from public.subscription_history where organization_id=p_org),'rows',coalesce((select jsonb_agg(x) from (select * from public.subscription_history where organization_id=p_org order by created_at desc limit 20 offset (p_page-1)*20) x),'[]'::jsonb));
end $function$;
