import type { ReactNode } from 'react';

/** The paper card the forms sit in. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-4 rounded-3xl border border-line bg-paper p-6 lg:gap-5 lg:p-10 ${className}`}>
      {children}
    </div>
  );
}
