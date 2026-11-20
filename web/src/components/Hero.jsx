import React, { useRef, useEffect, useState } from "react";
import "./Hero.css";
import { bannerService, isVideoMedia } from "../services/bannerService";

export default function Hero() {
  const videoRef = useRef(null);
  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadHeroMedia() {
      try {
        const data = await bannerService.getHeroVideo();
        if (isMounted && data) {
          setHeroData(data);
        }
      } catch (err) {
        console.warn("Could not load hero media from bannerService, using fallback:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadHeroMedia();
    return () => {
      isMounted = false;
    };
  }, []);

  // Use DB media only (no hardcoded fallback)
  const mediaUrl = heroData?.url || null;
  const isVideo = isVideoMedia(mediaUrl);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo || !mediaUrl) return;

    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.log("Autoplay notice:", err?.message || err);
      });
    }
  }, [mediaUrl, isVideo]);

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
        {mediaUrl ? (
          isVideo ? (
            <video
              ref={videoRef}
              className="hero-video-player"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              key={mediaUrl}
            >
              <source
                src={mediaUrl}
                type={/\.webm(\?.*)?$/i.test(mediaUrl) ? "video/webm" : "video/mp4"}
              />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={mediaUrl}
              alt="Zion Eye Care Showcase"
              className="hero-video-player"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          )
        ) : (
          <div className="hero-video-placeholder" />
        )}
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
