import React from 'react';
import { Link } from 'react-router-dom';
import eyeglassesImage from '../assets/home/eye1.jpg';
import sunglassesImage from '../assets/home/eye2.jpg';
import './EyewearFeatureSection.css';

const eyewearTypes = [
  {
    key: 'eyeglasses',
    title: 'Eyeglasses',
    description: 'Clear vision and effortless style for every day.',
    href: '/category/eyeglasses',
    image: eyeglassesImage,
  },
  {
    key: 'sunglasses',
    title: 'Sunglasses',
    description: 'Comfortable sun protection, wherever life takes you.',
    href: '/category/sunglasses',
    image: sunglassesImage,
  },
];

export default function EyewearFeatureSection() {
  return (
    <section className="eyewear-feature-section" aria-label="Explore eyewear">
      {eyewearTypes.map((card) => (
        <Link
          key={card.key}
          to={card.href}
          className={`eyewear-feature-card eyewear-feature-card--${card.key}`}
          aria-label={`Shop ${card.title}`}
        >
          <img
            className="eyewear-feature-image"
            src={card.image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
          <span className="eyewear-feature-overlay" aria-hidden="true" />
          <span className="eyewear-feature-copy">
            <span className="eyewear-feature-title">{card.title}</span>
            <span className="eyewear-feature-description">{card.description}</span>
            <span className="eyewear-feature-cta">Explore</span>
          </span>
        </Link>
      ))}
    </section>
  );
}
