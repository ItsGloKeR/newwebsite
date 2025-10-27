// components/CustomVideoPlayer.tsx
import React, { useEffect, useRef } from 'react';

interface CustomVideoPlayerProps {
  src: string | null;
  subtitles: { src: string; label: string; srclang: string; default?: boolean; kind?: string }[];
}

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ src, subtitles }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video && src) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src;
      } else {
        // For other browsers, a library like hls.js would be ideal,
        // but we rely on native support as per constraints.
        // This may not work on Chrome/Firefox desktop without extensions.
        console.warn('HLS playback not natively supported. Playback may fail on this browser.');
        video.src = src;
      }
      video.load();
    }
  }, [src]);

  if (!src) {
    return null; // Don't render anything if there's no source
  }

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      crossOrigin="anonymous"
      className="w-full h-full bg-black"
      playsInline
    >
      {subtitles.map((sub, index) => (
        <track
          key={index}
          src={sub.src}
          kind={sub.kind || 'subtitles'}
          srcLang={sub.srclang}
          label={sub.label}
          default={sub.default}
        />
      ))}
      Your browser does not support the video tag.
    </video>
  );
};

export default CustomVideoPlayer;