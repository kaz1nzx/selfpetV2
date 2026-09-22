"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

type Props = ComponentProps<"button"> & { pendingLabel?: string };

export function SubmitButton({ children, disabled, pendingLabel = "Salvando…", className = "btn", ...props }: Props) {
  const { pending } = useFormStatus();
  return <button {...props} type="submit" className={className} disabled={disabled || pending} aria-busy={pending}>
    {pending ? pendingLabel : children}
  </button>;
}
