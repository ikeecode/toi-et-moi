'use client';

import { LoaderCircle } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { cn } from '@/lib/utils';

export function FormSubmitButton({
  className,
  children,
  pendingLabel = 'Envoi...',
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
  variant?: 'primary' | 'secondary';
}) {
  const { pending } = useFormStatus();
  const isDisabled = pending || props.disabled;

  return (
    <button
      type="submit"
      className={cn(
        variant === 'primary' ? 'cta-primary' : 'cta-secondary',
        'w-full',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {pending ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
