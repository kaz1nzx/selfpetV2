-- SelfPet — exclusão definitiva de uma conta (empresa + dados + usuários Auth)
-- pelo painel global /admin.
--
-- Rode este arquivo no SQL Editor do Supabase (como postgres) para habilitar o
-- botão "Excluir conta". Nada aqui exige a service_role no frontend: a exclusão
-- roda numa função security definer, no mesmo padrão de admin_subscription().
--
-- Segurança: usa private.is_saas_admin(true), ou seja, mantém a exigência de
-- MFA/AAL2 para operações críticas. Se o seu admin global não usa MFA e a
-- exclusão retornar FORBIDDEN, troque o true por false na linha indicada.
--
-- Ordem da exclusão (importa!): os triggers de auditoria gravam em audit_logs
-- referenciando a organização, e essa FK não tem ON DELETE CASCADE. Por isso a
-- empresa é apagada POR ÚLTIMO — enquanto ela existe, qualquer log que os
-- triggers queiram gravar é aceito normalmente.

-- Limpa as linhas de uma organização em todas as tabelas que a referenciam,
-- em public e private. Várias passadas resolvem as dependências entre filhas e
-- mães sem precisar conhecer o grafo de chaves estrangeiras de antemão.
create or replace function private.admin_purge_org_rows(p_org uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_tables  text[];
  v_table   text;
  v_pass    integer;
  v_pending integer;
begin
  select coalesce(array_agg(format('%I.%I', c.table_schema, c.table_name)), '{}'::text[])
    into v_tables
  from information_schema.columns c
  join information_schema.tables t
    on t.table_schema = c.table_schema
   and t.table_name   = c.table_name
  where c.column_name  = 'organization_id'
    and t.table_type   = 'BASE TABLE'
    and c.table_schema in ('public', 'private')
    and not (c.table_schema = 'public' and c.table_name = 'organizations');

  for v_pass in 1..6 loop
    v_pending := 0;
    foreach v_table in array v_tables loop
      begin
        execute format('delete from %s where organization_id = $1', v_table) using p_org;
      exception
        when foreign_key_violation then
          v_pending := v_pending + 1;
      end;
    end loop;
    exit when v_pending = 0;
  end loop;
end
$function$;

create or replace function private.admin_delete_organization(p_org uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_name          text;
  v_users         uuid[];
  v_deleted_users integer := 0;
begin
  -- troque para private.is_saas_admin(false) se o admin global não usa MFA
  if not private.is_saas_admin(true) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_org is null then
    raise exception 'INVALID_INPUT';
  end if;

  select o.name into v_name from public.organizations o where o.id = p_org;
  if v_name is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Contas Auth que pertencem SOMENTE a esta organização. Quem também é membro
  -- de outra empresa mantém o login.
  select coalesce(array_agg(distinct m.user_id), '{}'::uuid[])
    into v_users
  from public.organization_members m
  where m.organization_id = p_org
    and m.user_id is not null
    and not exists (
      select 1
      from public.organization_members other
      where other.user_id = m.user_id
        and other.organization_id <> p_org
    );

  -- 1) Dados da operação.
  perform private.admin_purge_org_rows(p_org);

  -- 2) Contas de login — ainda com a organização existindo, para que qualquer
  --    trigger de auditoria disparado aqui consiga gravar sem violar a FK.
  if array_length(v_users, 1) is not null then
    delete from auth.users where id = any(v_users);
    get diagnostics v_deleted_users = row_count;
  end if;

  -- 3) Limpa o que os triggers gravaram durante os passos 1 e 2.
  perform private.admin_purge_org_rows(p_org);

  -- 4) Por fim a empresa. Um log de auditoria não pode sobreviver ao registro
  --    que ele referencia, então os triggers de usuário de audit_logs e de
  --    organizations ficam desligados só durante estas linhas. As checagens de
  --    chave estrangeira continuam ativas e qualquer falha desfaz tudo.
  if to_regclass('public.audit_logs') is not null then
    execute 'alter table public.audit_logs disable trigger user';
    execute 'delete from public.audit_logs where organization_id = $1' using p_org;
  end if;

  alter table public.organizations disable trigger user;
  delete from public.organizations where id = p_org;
  alter table public.organizations enable trigger user;

  if to_regclass('public.audit_logs') is not null then
    execute 'alter table public.audit_logs enable trigger user';
  end if;

  return jsonb_build_object('name', v_name, 'deleted_users', v_deleted_users);
end
$function$;

-- Wrapper público: é o que o PostgREST/supabase-js enxerga.
create or replace function public.admin_delete_organization(p_org uuid)
returns jsonb
language sql
security definer
set search_path to ''
as $function$
  select private.admin_delete_organization(p_org);
$function$;

revoke all on function public.admin_delete_organization(uuid) from public, anon;
grant execute on function public.admin_delete_organization(uuid) to authenticated;
