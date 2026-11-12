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

  const handleScrollDown = () => {
    const nextSection =
      document.getElementById("new-arrivals") ||
      document.querySelector(".service-section") ||
      document.querySelector(".homepage > *:nth-child(4)");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
    }
  };

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
        <div className="hero-video-overlay" />
        <button
          type="button"
          className="hero-scroll-indicator"
          onClick={handleScrollDown}
          aria-label="Scroll to explore products"
        >
          <span className="hero-scroll-text">Explore</span>
          <svg
            className="hero-scroll-arrow"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    </section>
  );
}
