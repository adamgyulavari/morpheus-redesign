import type { ReactNode } from 'react';

/** A required tick box with its sentence ("Elolvastam és elfogadom…"). */
export default function Checkbox({ name, children }: { name: string; children: ReactNode }) {
  return (
    <label className="flex items-start gap-3 text-[15px] leading-relaxed text-ink2">
      <input type="checkbox" name={name} required className="mt-1 h-5 w-5 shrink-0 accent-teal" />
      <span>{children} *</span>
    </label>
  );
}
