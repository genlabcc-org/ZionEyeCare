import React from 'react';
import visionDiagnosticsImg from '../assets/home/dept-vision-diagnostics.jpg';
import retinaGlaucomaImg from '../assets/home/dept-retina-glaucoma.jpg';
import pediatricCorneaImg from '../assets/home/dept-pediatric-cornea.jpg';
import fallbackEyeglassesImg from '../assets/home/eye1.jpg';
import './EyeCareDepartments.css';

const DEPARTMENTS = [
  {
    id: 'vision-diagnostics',
    title: 'Vision Diagnostics',
    description:
      'Computerized eye exams & visual acuity testing for accurate prescription care.',
    image: visionDiagnosticsImg,
    fallback: fallbackEyeglassesImg,
    imageAlt: 'Optometrist performing a slit-lamp and phoropter eye examination',
    href: '/contact',
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="eye-dept-card-svg"
        aria-hidden="true"
      >
        <path
          d="M4 24C4 24 11.5 11 24 11C36.5 11 44 24 44 24C44 24 36.5 37 24 37C11.5 37 4 24 4 24Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="24"
          cy="24"
          r="7.5"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <circle
          cx="24"
          cy="24"
          r="3"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M24 5V8M14 7.5L15.5 10M34 7.5L32.5 10M24 40V43M14 40.5L15.5 38M34 40.5L32.5 38"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'retina-glaucoma',
    title: 'Retina & Glaucoma',
    description:
      'Advanced retinal imaging, intraocular pressure checks, and optic nerve care.',
    image: retinaGlaucomaImg,
    fallback: fallbackEyeglassesImg,
    imageAlt: 'Ophthalmologist analyzing a digital retinal fundus and OCT scan',
    href: '/contact',
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="eye-dept-card-svg"
        aria-hidden="true"
      >
        <circle
          cx="24"
          cy="24"
          r="17"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <circle
          cx="24"
          cy="24"
          r="11.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeDasharray="3 3"
        />
        <circle
          cx="20"
          cy="24"
          r="4"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M23.5 22C27 19.5 31 17 35 16M23.5 26C27.5 28.5 31 31 35 32M21 20C22 16 24.5 13 28 11.5M21 28C22.5 32 25 35 28.5 36.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'optical-lens-lab',
    title: 'Precision Lens Lab',
    description:
      'Custom progressive, blue-light digital & high-index prescription lenses.',
    image:
      'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=800&q=80',
    fallback: fallbackEyeglassesImg,
    imageAlt: 'Precision optical lenses and custom-fitted prescription frames',
    href: '/products',
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="eye-dept-card-svg"
        aria-hidden="true"
      >
        <rect
          x="6"
          y="7"
          width="36"
          height="34"
          rx="5"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <circle
          cx="24"
          cy="24"
          r="11"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M17 20L27 30M21 17L30 26M11 12H15M33 12H37M11 36H15M33 36H37"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'pediatric-cornea',
    title: 'Pediatric & Cornea',
    description:
      'Gentle vision screening, myopia control, and dry-eye therapy for all ages.',
    image: pediatricCorneaImg,
    fallback: fallbackEyeglassesImg,
    imageAlt: 'Optometrist performing a gentle pediatric vision check with trial lens frames',
    href: '/contact',
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="eye-dept-card-svg"
        aria-hidden="true"
      >
        <path
          d="M24 6L38 12V23C38 32.5 31.8 39.8 24 42C16.2 39.8 10 32.5 10 23V12L24 6Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 24C16 24 19.2 18.5 24 18.5C28.8 18.5 32 24 32 24C32 24 28.8 29.5 24 29.5C19.2 29.5 16 24 16 24Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="24" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
];

export default function EyeCareDepartments() {
  return (
    <section
      className="eye-dept-section"
      aria-labelledby="eye-dept-section-heading"
    >
      <div className="eye-dept-container">
        {/* ── Header Row ── */}
        <div className="eye-dept-header">
          <div className="eye-dept-header-left">
            <div className="eye-dept-badge" aria-hidden="true">
              <svg
                className="eye-dept-badge-icon"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 3H15V9H21V15H15V21H9V15H3V9H9V3Z"
                  fill="#17202f"
                />
                <path
                  d="M7.5 12H9.5L10.8 9.2L13 14.8L14.2 12H16.5"
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="eye-dept-badge-text">Departments</span>
            </div>

            <h2 id="eye-dept-section-heading" className="eye-dept-heading">
              Specialized departments
              <br />
              for complete eye care
            </h2>
          </div>
        </div>

        {/* ── 2x2 Department Pairs Grid ── */}
        <div className="eye-dept-grid">
          {DEPARTMENTS.map((dept) => (
            <div className="eye-dept-pair" key={dept.id}>
              <div className="eye-dept-image-card">
                <img
                  src={dept.image}
                  alt={dept.imageAlt}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    if (e.currentTarget.src !== dept.fallback) {
                      e.currentTarget.src = dept.fallback;
                    }
                  }}
                />
              </div>

              <div className="eye-dept-info-card">
                <div className="eye-dept-icon-wrap">{dept.icon}</div>

                <div className="eye-dept-copy">
                  <h3 className="eye-dept-card-title">{dept.title}</h3>
                  <p className="eye-dept-card-desc">{dept.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
