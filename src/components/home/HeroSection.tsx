'use client';

import { useRef, useState } from 'react';
import { Play, Pause, PauseIcon } from 'lucide-react';

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section className="relative h-[96vh] w-full overflow-hidden flex items-center justify-center text-white">
      
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src="/videos/hero_video.mp4" type="video/mp4" />
      </video>

      {/* Play / Pause button - top right */}
      <button
        type="button"
        onClick={togglePlay}
        className="absolute cursor-pointer top-4 right-4 md:top-6 md:right-6 z-20 p-2 lg:p-3 rounded-full hover:bg-white/30 hover:backdrop-blur-sm transition-colors"
        aria-label={isPlaying ? 'Pause video' : 'Play video'}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 lg:w-6 lg:h-6 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" strokeWidth={2} />
        ) : (
          <Play className="w-5 h-5 lg:w-6 lg:h-6 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" strokeWidth={2} />
        )}
      </button>

      {/* Container */}
      <div className="absolute top-36 right-4 left-4 lg:top-24 lg:right-8 lg:left-8 z-10 flex items-center justify-center">
        
        <div
          className="max-w-8xl w-full px-4 lg:px-8"
          data-aos="fade-up"
          data-aos-duration="800"
          data-aos-once="true"
        >
          <div className="w-full md:w-8/12 lg:w-6/12 bg-primary/20 p-4 lg:p-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl 2xl:text-6xl font-medium leading-tight">
              Ambition Guided by Intelligence. Defined by Performance
            </h1>
          </div>
        </div>

      </div>

      {/* Bottom trapezium */}
      <div className="trapezium-wrap absolute bottom-0 left-1/2 -translate-x-1/2 px-4 md:px-8 w-full max-w-8xl z-30">
        <div className="trapezium-reverse mx-auto">
          <div className="trapezium-inner">
            <p className="text-base text-center md:text-lg lg:text-xl  opacity-90 leading-relaxed">
              <span className="text-center">
              Leveraging two decades of market experience, we identify real-time market opportunities and manage risk dynamically to deliver consistent, exceptional capital performance.

              </span>
             
            </p>
          </div>
        </div>
      </div>

    </section>
  );
}