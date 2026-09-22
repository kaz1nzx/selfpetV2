const messages: Record<string, string> = {
  "dados-invalidos": "Confira os dados informados e tente novamente.",
  "falha-ao-salvar": "Não foi possível salvar. Tente novamente.",
  "falha-ao-excluir": "Não foi possível excluir. Tente novamente.",
  "sem-permissao": "Seu usuário não tem permissão para esta ação no banco. Rode o SQL em supabase/delete_policies.sql no Supabase.",
  "tutor-com-pets": "Este tutor ainda possui pets cadastrados. Exclua ou transfira os pets antes de removê-lo.",
  "tutor-com-historico": "Este tutor possui histórico de atendimentos e não pode ser excluído.",
  "pet-com-historico": "Este pet possui histórico de atendimentos registrado e não pode ser excluído.",
  "servico-em-uso": "Este serviço está vinculado a atendimentos já registrados. Desative-o em vez de excluir.",
  "tutor-invalido": "Selecione um tutor válido.",
  "referencia-invalida": "Tutor, pet, funcionário ou serviço inválido.",
  "agendamento-sem-servico": "Selecione e salve um serviço no agendamento antes de concluir. O preço dele será registrado como entrada.",
  "agendamento-concluido": "Desmarque a conclusão antes de alterar o serviço, a data ou os participantes deste atendimento.",
  "agendamento-com-pagamentos": "Este atendimento possui pagamentos registrados. Revise os pagamentos antes de desmarcar a conclusão.",
  "data-invalida": "Data e horário inválidos.",
  "foto-invalida": "Fotos devem ser PNG, JPG ou WEBP.",
  "limite-do-plano": "Você atingiu o limite de pets do seu plano.",
  "acao-invalida": "Ação inválida.",
  "plano-insuficiente": "Este recurso está disponível nos planos Premium e Pro.",
  "conta-nao-encontrada": "Conta não encontrada — talvez já tenha sido excluída.",
  "sem-permissao-admin": "O banco recusou a exclusão. Ela exige MFA ativo no seu admin global (veja o comentário no topo de supabase/admin_delete_account.sql).",
  "rpc-ausente": "A função de exclusão ainda não existe no banco. Rode o SQL em supabase/admin_delete_account.sql no Supabase.",
};

const successes: Record<string, string> = {
  salvo: "Alterações salvas com sucesso.",
  removido: "Registro excluído com sucesso.",
  concluido: "Atendimento concluído. O valor do serviço foi registrado nas entradas e no relatório do mês do agendamento.",
  reaberto: "Conclusão desfeita. O atendimento voltou para agendado e o valor foi retirado das entradas.",
  "conta-removida": "Conta excluída definitivamente: empresa, dados e usuários.",
};

/** Banners de sucesso/erro a partir dos parâmetros de URL usados pelas server actions. */
export function Feedback({ query }: { query: Record<string, string | undefined> }) {
  const success = query.salvo ? successes.salvo : query.removido ? successes.removido : query.status ? successes[query.status] : null;
  const error = query.erro ? messages[query.erro] ?? `Não foi possível concluir a ação: ${decodeURIComponent(query.erro)}` : null;
  if (!success && !error) return null;
  return <>
    {success && <div className="success">{success}</div>}
    {error && <div className="error">{error}</div>}
  </>;
}
