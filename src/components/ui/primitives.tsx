'use client';

import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-[background,transform,opacity,box-shadow] duration-150 select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 cursor-pointer';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg shadow-[0_6px_18px_-8px_var(--accent)] hover:brightness-110',
  ghost: 'text-fg hover:bg-accent-soft',
  subtle: 'glass-inner text-fg hover:bg-accent-soft',
  danger: 'glass-inner text-danger hover:bg-[color-mix(in_srgb,var(--danger)_14%,transparent)]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[0.8rem]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }
>(function Button({ variant = 'subtle', size = 'md', className, type = 'button', ...props }, ref) {
  return <button ref={ref} type={type} className={cn(buttonBase, variants[variant], sizes[size], className)} {...props} />;
});

export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: ButtonVariant; size?: 'sm' | 'md' }
>(function IconButton({ label, variant = 'ghost', size = 'md', className, type = 'button', children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(buttonBase, variants[variant], size === 'sm' ? 'size-8' : 'size-10', className)}
      {...props}
    >
      {children}
    </button>
  );
});

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex min-w-6 items-center justify-center rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.7rem] font-medium text-fg-muted',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm text-fg placeholder:text-fg-muted/80 transition-colors',
        'focus-visible:border-accent-text focus-visible:outline-2',
        className,
      )}
      {...props}
    />
  );
});

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full cursor-pointer rounded-xl border border-line bg-surface-solid px-3 text-sm text-fg focus-visible:border-accent-text',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

/** Accessible on/off switch (native checkbox with role="switch"). */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-sm font-medium text-fg">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-fg-muted">{description}</span>}
      </label>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border border-line bg-surface-2 transition-colors peer-checked:border-transparent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-text peer-disabled:opacity-50"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
        />
      </span>
    </div>
  );
}

/** Segmented single-choice control implemented as a native radio group. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: ReactNode; ariaLabel?: string }>;
  onChange: (value: T) => void;
  className?: string;
}) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-xl border border-line bg-surface-2 p-0.5', className)}>
      {options.map((option) => (
        <label key={option.value} className="relative cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            aria-label={option.ariaLabel}
            className="peer sr-only"
          />
          <span className="flex h-8 items-center justify-center rounded-[0.65rem] px-3 text-[0.8rem] font-medium text-fg-muted transition-colors peer-checked:bg-accent peer-checked:text-accent-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-text hover:text-fg peer-checked:hover:text-accent-fg">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  /** Render prop receives the id to put on the control so the label is programmatically associated. */
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-fg-muted">{hint}</p>}
    </div>
  );
}

export function Card({
  title,
  icon,
  actions,
  children,
  className,
  id,
  ...props
}: {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
} & Omit<React.HTMLAttributes<HTMLElement>, 'title'>) {
  const headingId = useId();
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn('glass flex min-h-0 flex-col rounded-card p-4 sm:p-5', className)}
      {...props}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 id={headingId} className="flex items-center gap-2 text-[0.8rem] font-semibold tracking-[0.08em] text-fg-muted uppercase">
          {icon && <span className="text-accent-text">{icon}</span>}
          {title}
        </h2>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </header>
      {children}
    </section>
  );
}
