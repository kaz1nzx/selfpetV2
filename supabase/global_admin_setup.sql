-- Execute manual e conscientemente no SQL Editor do Supabase para promover
-- um usuário Auth existente a administrador global do SaaS.
-- Não depende do papel OWNER/ADMIN de nenhuma organização e não usa senha.
-- Substitua o UUID abaixo pelo auth.users.id correto.

insert into private.saas_admins (user_id)
values ('00000000-0000-0000-0000-000000000000'::uuid)
on conflict (user_id) do nothing;

-- O acesso de leitura ao painel /admin usa is_global_admin(), sem exigir MFA.
-- As ações críticas de assinatura continuam usando admin_subscription(),
-- que preserva a exigência de MFA/AAL2 no backend.
