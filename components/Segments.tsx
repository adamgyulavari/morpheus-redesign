import { Fragment } from 'react';

import SmartLink from '@/components/SmartLink';
import type { Segment } from '@/lib/types';

/** One paragraph's segments from the CMS: plain text, and links where the editor made one. */
export default function Segments({ segments }: { segments: Segment[] }) {
  return segments.map((segment, position) =>
    segment.href ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: segments of one paragraph, fixed by position
      <SmartLink key={position} href={segment.href} className="link font-semibold text-teal">
        {segment.text}
      </SmartLink>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: segments of one paragraph, fixed by position
      <Fragment key={position}>{segment.text}</Fragment>
    ),
  );
}
