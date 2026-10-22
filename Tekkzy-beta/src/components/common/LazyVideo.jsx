import React, { useEffect, useRef, useState } from 'react';

/**
 * Video that only downloads and plays when it approaches the viewport.
 * The src is attached on first intersection (so nothing is fetched before
 * that), playback starts when visible and pauses when scrolled away.
 */
const LazyVideo = ({
  src,
  type = 'video/mp4',
  rootMargin = '200px',
  className,
  style,
  ...videoProps
}) => {
  const videoRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          if (video.readyState > 0) {
            video.play().catch(() => {});
          }
        } else {
          video.pause();
        }
      },
      { rootMargin }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [rootMargin]);

  // The source element is added after mount, so kick off loading explicitly.
  useEffect(() => {
    const video = videoRef.current;
    if (!shouldLoad || !video) return;
    video.load();
    video.play().catch(() => {
      // Autoplay can be blocked until user interaction; muted loops usually pass.
    });
  }, [shouldLoad, src]);

  return (
    <video
      ref={videoRef}
      className={className}
      style={style}
      loop
      muted
      playsInline
      preload="none"
      {...videoProps}
    >
      {shouldLoad && <source src={src} type={type} />}
      Your browser does not support the video tag.
    </video>
  );
};

export default LazyVideo;
