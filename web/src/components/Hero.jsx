import React, { useRef, useEffect } from "react";
import "./Hero.css";

export default function Hero() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.log("Autoplay notice:", err?.message || err);
      });
    }
  }, []);

  return (
    <section className="hero-video-section" aria-label="Zion Eye Care Showcase">
      <div className="hero-video-container">
        <video
          ref={videoRef}
          className="hero-video-player"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="/zion-hero.mp4" type="video/mp4" />
          <source src="/zion-hero.mov" type="video/quicktime" />
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
}
