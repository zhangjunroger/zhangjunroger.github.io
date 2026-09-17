import type { ReactNode } from 'react';

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  icon?: ReactNode;
  id?: string;
}

export default function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  icon,
  id,
}: SectionTitleProps) {
  return (
    <div
      id={id}
      className={`mb-12 ${
        align === 'center' ? 'text-center mx-auto max-w-3xl' : ''
      }`}
    >
      {eyebrow && (
        <div
          className={`inline-flex items-center gap-2 mb-3 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase
                     bg-signal-500/10 text-signal-400 border border-signal-500/20
                     ${align === 'center' ? '' : ''}`}
        >
          {icon && <span>{icon}</span>}
          {eyebrow}
        </div>
      )}
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
  );
}
