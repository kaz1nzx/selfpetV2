-- DIAGNÓSTICO (só leitura, não altera nada).
-- Rode no SQL Editor do Supabase e me mande o resultado das 3 consultas.
-- Pode apagar este arquivo depois.

-- 1) Quais triggers gravam em audit_logs, e em que tabela eles estão?
select n.nspname   as schema,
       c.relname   as tabela,
       t.tgname    as trigger,
       p.proname   as funcao,
       case t.tgtype::integer & 1 when 1 then 'ROW' else 'STATEMENT' end as nivel,
       case when (t.tgtype::integer & 2)  > 0 then 'BEFORE'
            when (t.tgtype::integer & 64) > 0 then 'INSTEAD OF'
            else 'AFTER' end as momento,
       case when (t.tgtype::integer & 8) > 0 then 'DELETE'
            when (t.tgtype::integer & 4) > 0 then 'INSERT'
            when (t.tgtype::integer & 16) > 0 then 'UPDATE'
            else 'OUTRO' end as evento
from pg_trigger t
join pg_class     c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc      p on p.oid = t.tgfoid
where not t.tgisinternal
  and pg_get_functiondef(p.oid) ilike '%audit_logs%'
order by 1, 2, 3;

-- 2) Como está definida a FK de audit_logs para organizations?
select conname,
       pg_get_constraintdef(oid) as definicao,
       condeferrable             as adiavel
from pg_constraint
where conrelid = 'public.audit_logs'::regclass
  and contype  = 'f';

-- 3) Quem mais referencia organizations (inclusive fora do schema public)?
select n.nspname || '.' || c.relname as tabela,
       co.conname,
       pg_get_constraintdef(co.oid)  as definicao
from pg_constraint co
join pg_class     c on c.oid = co.conrelid
join pg_namespace n on n.oid = c.relnamespace
where co.confrelid = 'public.organizations'::regclass
order by 1;
