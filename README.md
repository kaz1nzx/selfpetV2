# SelfPet MVP — Next.js + Supabase

Starter funcional conectado ao projeto Supabase `selfpet`.

## O que já está incluído

- Next.js App Router + TypeScript
- Supabase SSR/Auth
- Cadastro e login
- Dashboard protegido
- Multi-tenancy usando a membership já existente no banco
- CRUD inicial de clientes, pets, serviços e funcionários
- Leitura do histórico de atendimentos
- Página de assinatura Free / Premium / Pro
- Validação com Zod
- Sem `service_role` no frontend ou no repositório

## Configuração

1. Copie `.env.example` para `.env.local`.
2. Instale dependências: `npm install`
3. Execute: `npm run dev`
4. Abra `http://localhost:3000`

A URL e a publishable key do Supabase podem ficar no cliente. **Nunca adicione a service role key a variáveis `NEXT_PUBLIC_*`.**

## Planos

- Free: 10 pets
- Premium: 50 pets — R$ 29,90/mês
- Pro: pets ilimitados — R$ 79,90/mês

O limite é reforçado no banco pelo trigger já existente, portanto não depende apenas da interface.

## Importante sobre cadastro

O projeto Supabase possui o trigger `selfpet_user_created` em `auth.users`. O formulário de cadastro envia metadados comuns (`name`, `full_name`, `organization_name`, `business_name`, `trade_name`) para facilitar o onboarding. Teste o primeiro cadastro antes de avançar com o restante do frontend.

## Atendimentos

O banco já possui a RPC `create_service_record`. Este starter lista atendimentos existentes, mas não envia novos registros até validarmos o contrato JSON esperado em `p_items`. Isso evita inventar um payload incompatível com a função segura já criada no banco.

## Próximos passos recomendados

1. Testar cadastro real e confirmar criação automática de organização + membership + assinatura Free.
2. Testar com duas organizações e confirmar isolamento por RLS.
3. Implementar edição/exclusão e uploads WebP.
4. Integrar a tela de criação de atendimento à RPC existente.
5. Implementar painel global de assinatura manual.
6. Rodar `npm run typecheck` e `npm run build` antes do deploy na Vercel.
