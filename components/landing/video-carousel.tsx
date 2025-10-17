"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_DURATION_MS = 5800;

const videos = [
  { src: "/videos/mountainwalk.mp4", alt: "Mountain walk with a local guide" },
  { src: "/videos/grouptravel.mp4", alt: "Group travel experience" },
  { src: "/videos/marketguide.mp4", alt: "Guide leading visitors through a market" },
  { src: "/videos/museumguide.mp4", alt: "Guide explaining exhibits in a museum" },
];

export function VideoCarousel() {
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % videos.length);
    }, VIDEO_DURATION_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const source = videos[index].src;
    const absoluteSrc = typeof window === "undefined" ? source : new URL(source, window.location.origin).toString();

    if (video.src !== absoluteSrc) {
      video.src = absoluteSrc;
    }

    const play = async () => {
      try {
        await video.play();
      } catch (error) {
        console.warn("Unable to autoplay hero video", error);
      }
    };

    video.load();
    void play();
  }, [index]);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl shadow-lg aspect-video">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        controls={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-background/40 pointer-events-none" />
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {videos.map((video, dotIdx) => (
          <button
            key={video.src}
            type="button"
            onClick={() => setIndex(dotIdx)}
            className={`h-2.5 w-2.5 rounded-full transition ${dotIdx === index ? 'bg-white' : 'bg-white/40'}`}
            aria-label={`Show video ${dotIdx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
2