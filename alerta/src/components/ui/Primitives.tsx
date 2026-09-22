import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`bg-white rounded-2xl shadow-card border border-ink-100 ${className}`}>{children}</div>;
}

export function Label({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`block text-sm font-medium text-ink-700 mb-1.5 ${className}`} {...props} />;
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-base text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none disabled:bg-ink-50 ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-base text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-base text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
}) {
  const toneClasses: Record<string, string> = {
    neutral: 'bg-ink-100 text-ink-700',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-emergency-100 text-emergency-800',
    brand: 'bg-brand-100 text-brand-800',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {icon && <div className="mb-4 text-ink-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-ink-500 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg bg-emergency-50 border border-emergency-200 text-emergency-800 px-4 py-3 text-sm font-medium">
      {message}
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div role="status" className="bg-ink-800 text-white text-sm font-medium text-center py-2 px-4">
      You're offline. Some actions may not work until your connection is back.
    </div>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-ink-200 border-t-brand-600 ${className}`} />
  );
}
