"use client";

/** Botão de submit que pede confirmação antes de enviar o formulário. */
export function ConfirmButton({ message, children, className = "btn danger" }: { message: string; children: React.ReactNode; className?: string }) {
  return <button type="submit" className={className} onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}>{children}</button>;
}
