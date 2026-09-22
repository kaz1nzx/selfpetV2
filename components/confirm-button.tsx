"use client";

import { SubmitButton } from "@/components/submit-button";

/** Botão de submit que pede confirmação antes de enviar o formulário. */
export function ConfirmButton({ message, children, className = "btn danger" }: { message: string; children: React.ReactNode; className?: string }) {
  return <SubmitButton className={className} pendingLabel="Excluindo…" onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}>{children}</SubmitButton>;
}
