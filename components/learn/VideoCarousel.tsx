'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export interface VideoType {
  id: string;
  title: string;
  channelName: string;
  whyWatch: string;
  posterUrl: string;
  youtubeUrl: string;
}

interface VideoCarouselProps {
  videos: VideoType[];
}

export default function VideoCarousel({ videos }: VideoCarouselProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleVideoClick = (video: VideoType) => {
    if (!isDragging) {
      setSelectedVideo(video);
    }
  };

  const closeModal = () => {
    setSelectedVideo(null);
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const videoId = url.split('v=')[1];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0));
    setScrollLeft(carouselRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (carouselRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!carouselRef.current) return;
    
    if (e.key === 'ArrowLeft') {
      carouselRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    } else if (e.key === 'ArrowRight') {
      carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full">
      <div 
        ref={carouselRef}
        className="carousel flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {videos.map((video) => (
          <div 
            key={video.id}
            className="carousel-item snap-start  flex-col w-[calc(40%-1rem)] relative group cursor-grab active:cursor-grabbing"
          >
            <div className="relative aspect-video">
              <Image
                src={video.posterUrl}
                alt={video.title}
                className="object-cover rounded-lg w-full h-full"
                quality={75}
                width={300}
                height={100}
              />
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors rounded-lg"
                onClick={() => handleVideoClick(video)}
              >
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg">
                <p className="text-white text-sm font-medium line-clamp-3">{video.whyWatch}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-lg font-medium text-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">{video.title} – {video.channelName}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-[90vw] aspect-video">
            <iframe
              src={getYoutubeEmbedUrl(selectedVideo.youtubeUrl)}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 btn btn-ghost text-white"
            >
              Close
            </button>
            <a
              href={selectedVideo.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute -bottom-12 right-0 btn btn-ghost text-white"
            >
              Watch on YouTube
            </a>
          </div>
        </div>
      )}
    </div>
  );
} 