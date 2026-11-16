import React, { useState, useRef } from 'react';
import './CustomerExperiences.css';

const TOP_ROW_TESTIMONIALS = [
  {
    id: 1,
    name: 'Isabella Rodriguez',
    role: 'Creative Director & Verified Patient',
    text: 'Their ability to match the right frame and lens precision to my daily routine is unparalleled - an invaluable eye care partner.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    avatarBg: '#bae6fd',
  },
  {
    id: 2,
    name: 'Gabrielle Williams',
    role: 'Product Designer & Eyewear Enthusiast',
    text: 'Optical specialists who listen, understand, and craft crystal-clear vision solutions - a clinic that truly understands our needs.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80',
    avatarBg: '#fbcfe8',
  },
  {
    id: 3,
    name: 'Samantha Johnson',
    role: 'Architect & Progressive Lens Wearer',
    text: 'Exceeded our expectations with featherlight frames and anti-glare lenses that brought effortless comfort to my long workdays.',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=160&q=80',
    avatarBg: '#fde68a',
  },
  {
    id: 4,
    name: 'Ashik R.',
    role: 'Software Engineer & Daily Wearer',
    text: 'The blue-cut anti-glare lenses are a game changer for daily screen time. The frames do not pinch or leave marks even after a full day.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    avatarBg: '#c7d2fe',
  },
];

const BOTTOM_ROW_TESTIMONIALS = [
  {
    id: 5,
    name: 'Natalie Martinez',
    role: 'Founder & Brand Consultant',
    text: 'From eye checkup to frame styling, their attention to detail knows no bounds - a total game-changer for my everyday visual comfort.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
    avatarBg: '#ddd6fe',
  },
  {
    id: 6,
    name: 'Victoria Thompson',
    role: 'Marketing Lead & Sunglasses Collector',
    text: 'A refreshing and modern optical studio that consistently delivers exceptional lens clarity and fit - highly recommended for everyone.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    avatarBg: '#e9d5ff',
  },
  {
    id: 7,
    name: 'John Peter',
    role: 'Senior Consultant & Verified Buyer',
    text: 'Their team\'s clinical expertise and curated eyewear collection resulted in the sharpest vision I\'ve had in years - a reliable eye care partner.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    avatarBg: '#fed7aa',
  },
  {
    id: 8,
    name: 'Rahul Verma',
    role: 'Entrepreneur & Prescription Wearer',
    text: 'Replaced my old frames with Zion Eye Care after my first consultation. The lens clarity, balance, and build longevity are miles ahead.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80',
    avatarBg: '#bbf7d0',
  },
];

const QuoteIcon = () => (
  <svg
    className="testimonial-quote-icon"
    viewBox="0 0 36 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M8.2 27.2C5.8 27.2 3.85 26.4 2.35 24.8C0.85 23.2 0.1 21.1 0.1 18.5C0.1 15.6 0.95 12.65 2.65 9.65C4.35 6.65 6.85 3.65 10.15 0.65L12.85 2.9C10.55 5.3 8.85 7.55 7.75 9.65C6.65 11.75 6.1 13.7 6.1 15.5C6.7 15.1 7.55 14.9 8.65 14.9C10.55 14.9 12.1 15.5 13.3 16.7C14.5 17.9 15.1 19.45 15.1 21.35C15.1 23.15 14.45 24.6 13.15 25.7C11.85 26.7 10.2 27.2 8.2 27.2ZM27.4 27.2C25 27.2 23.05 26.4 21.55 24.8C20.05 23.2 19.3 21.1 19.3 18.5C19.3 15.6 20.15 12.65 21.85 9.65C23.55 6.65 26.05 3.65 29.35 0.65L32.05 2.9C29.75 5.3 28.05 7.55 26.95 9.65C25.85 11.75 25.3 13.7 25.3 15.5C25.9 15.1 26.75 14.9 27.85 14.9C29.75 14.9 31.3 15.5 32.5 16.7C33.7 17.9 34.3 19.45 34.3 21.35C34.3 23.15 33.65 24.6 32.35 25.7C31.05 26.7 29.4 27.2 27.4 27.2Z"
      fill="#3B5BDB"
    />
  </svg>
);

const TestimonialCard = ({ item }) => (
  <article className="testimonial-card">
    <div className="testimonial-quote-wrapper">
      <QuoteIcon />
    </div>

    <p className="testimonial-card-text">{item.text}</p>

    <div className="testimonial-author-row">
      <div
        className="testimonial-avatar-wrap"
        style={{ backgroundColor: item.avatarBg }}
      >
        <img
          src={item.avatar}
          alt={item.name}
          className="testimonial-avatar"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="testimonial-author-info">
        <h3 className="testimonial-author">{item.name}</h3>
        <span className="testimonial-role">{item.role}</span>
      </div>
    </div>
  </article>
);

const RealExperience = () => {
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimerRef = useRef(null);

  const handleTouchStart = () => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    setIsPaused(true);
  };

  const handleTouchEnd = () => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 2000);
  };

  const topLoop = [...TOP_ROW_TESTIMONIALS, ...TOP_ROW_TESTIMONIALS];
  const bottomLoop = [...BOTTOM_ROW_TESTIMONIALS, ...BOTTOM_ROW_TESTIMONIALS];

  return (
    <section className="testimonials-section" aria-label="Customer Testimonials">
      <div className="testimonials-heading-container">
        <h2 className="testimonials-heading">CUSTOMER TESTIMONIALS</h2>
      </div>

      <div
        className="testimonials-rows-wrapper"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="testimonials-scroll-container">
          <div className={`testimonials-track testimonials-track--top ${isPaused ? 'is-paused' : ''}`}>
            {topLoop.map((item, idx) => (
              <TestimonialCard item={item} key={`top-${item.id}-${idx}`} />
            ))}
          </div>
        </div>

        <div className="testimonials-scroll-container">
          <div className={`testimonials-track testimonials-track--bottom ${isPaused ? 'is-paused' : ''}`}>
            {bottomLoop.map((item, idx) => (
              <TestimonialCard item={item} key={`bottom-${item.id}-${idx}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RealExperience;
