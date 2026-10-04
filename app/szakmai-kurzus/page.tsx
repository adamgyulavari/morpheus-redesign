import type { Metadata } from 'next';

import CoursePageView from '@/components/CoursePageView';
import { getPageContent } from '@/lib/data';

// Static page, regenerated at most once a day (ISR) so a past intake month drops off without a redeploy.
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getPageContent('szakmai-kurzus');
  return { title: meta.title, description: meta.description };
}

export default function AdvancedCoursePage() {
  return <CoursePageView pageKey="szakmai-kurzus" />;
}
