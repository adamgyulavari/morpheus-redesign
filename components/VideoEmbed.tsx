'use client';

/**
 * Lazy YouTube embed: shows the thumbnail with the play button and only loads the (no-cookie)
 * player when clicked. Without JavaScript the link simply opens the video on YouTube.
 * Client component: swapping the facade for the iframe is a click interaction.
 */
import Image from 'next/image';
import { useState } from 'react';

import { PlayIcon } from './icons';

export default function VideoEmbed({ youtubeId, title }: { youtubeId: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="aspect-video w-full rounded-[18px] bg-deep lg:rounded-3xl"
      />
    );
  }

  return (
    <a
      href={`https://www.youtube.com/watch?v=${youtubeId}`}
      aria-label={`${title} lejátszása`}
      className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-[18px] bg-deep lg:rounded-3xl"
      onClick={(e) => {
        e.preventDefault();
        setPlaying(true);
      }}
    >
      <Image
        src={`https://i.ytimg.com/vi/${youtubeId}/sddefault.jpg`}
        alt=""
        fill
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover transition duration-300 group-hover:scale-[1.02]"
      />
      <span className="absolute inset-0 bg-deep/25 transition group-hover:bg-deep/10" aria-hidden="true" />
      <span className="sun relative flex h-[68px] w-[68px] items-center justify-center rounded-full text-deep shadow-[0_12px_30px_-10px_rgba(8,31,34,0.6)] transition group-hover:scale-105 lg:h-24 lg:w-24">
        <PlayIcon />
      </span>
    </a>
  );
}
