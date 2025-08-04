'use client';

import * as React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';

interface CarouselProps {
  images: string[];
}

export function Carousel({ images }: CarouselProps) {
  const [emblaRef] = useEmblaCarousel({ loop: true });

  return (
    <div className="h-full w-full overflow-hidden" ref={emblaRef}>
      <div className="flex h-full">
        {images.map((src, index) => (
          <div
            className="relative flex-[0_0_100%] h-full"
            key={index}
          >
            <Image
              src={src}
              alt={`slide-${index}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Carousel;
