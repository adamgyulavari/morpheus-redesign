import Link from 'next/link';

import type { Course } from '@/lib/types';

/**
 * "Kezdő kurzus | Szakmai kurzus" switch at the top of each course page — the course pages share
 * one nav item ("Képzések"), and this is how visitors move between them.
 */
export default function CourseSwitcher({ courses, currentId }: { courses: Course[]; currentId: string }) {
  const local = courses.filter((c) => c.url.startsWith('/'));
  if (local.length < 2) return null;
  return (
    <nav aria-label="Képzéseink" className="flex self-start rounded-full border-[1.5px] border-[#cdbda3] bg-paper p-1">
      {local.map((course) => {
        const current = course.id === currentId;
        return (
          <Link
            key={course.id}
            href={course.url}
            aria-current={current ? 'page' : undefined}
            className={`inline-flex min-h-[44px] items-center rounded-full px-4 text-[15px] font-semibold whitespace-nowrap transition-colors sm:px-5 ${
              current ? 'bg-teal text-cream' : 'text-teal hover:text-rust-dark'
            }`}
          >
            {course.title}
          </Link>
        );
      })}
    </nav>
  );
}
