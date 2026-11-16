import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import './FAQSection.css';

const FAQ_DATA = [
  {
    question: 'Do I need an appointment?',
    answer:
      'You can book an appointment online, call our reception, or visit the hospital in person.',
  },
  {
    question: 'Do you accept insurance?',
    answer:
      'Yes, we accept major health and vision insurance policies as well as corporate cashless tie-ups. Our front desk can assist with pre-authorisation and claim paperwork.',
  },
  {
    question: 'How can I book an appointment?',
    answer:
      'You can easily schedule a consultation through our online appointment form, message our clinic on WhatsApp, or call our direct helpline at +91 63798 38682.',
  },
  {
    question: 'Do you provide emergency care?',
    answer:
      'Yes, we provide emergency consultation and immediate care for sudden vision loss, chemical exposure, severe eye pain, foreign body removal, and acute ocular trauma.',
  },
  {
    question: 'Can I choose my doctor?',
    answer:
      'Absolutely. You can select your preferred eye care specialist, retina surgeon, or optometrist when booking your appointment online or over the phone.',
  },
  {
    question: 'Do you offer health checkup packages?',
    answer:
      'Yes, we offer comprehensive eye wellness packages including digital dilated retina scans, non-contact glaucoma screening, and pediatric vision checks.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0); // First item open by default as shown in reference

  const toggleItem = (idx) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="faq-section" aria-labelledby="faq-main-heading">
      <div className="faq-container">
        {/* Left Column: Heading, Badge, and Contact CTA */}
        <div className="faq-left-col">
          <div className="faq-badge" aria-hidden="true">
            <svg
              className="faq-badge-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 3H15V9H21V15H15V21H9V15H3V9H9V3Z"
                fill="#1e293b"
              />
              <path
                d="M7.5 12H9.5L10.8 9.2L13 14.8L14.2 12H16.5"
                stroke="#ffffff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="faq-badge-text">Faq's</span>
          </div>

          <h2 id="faq-main-heading" className="faq-heading">
            Frequently asked
            <br />
            questions
          </h2>

          <div className="faq-contact-box">
            <p className="faq-contact-prompt">
              Need help?
              <br />
              Get in touch with us
            </p>

            <Link
              to="/contact"
              className="faq-get-in-touch-btn"
              aria-label="Get in touch with us"
            >
              <span>Get In Touch</span>
              <span className="faq-btn-icon-circle">
                <FiArrowUpRight aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>

        {/* Right Column: Interactive Accordion Cards */}
        <div className="faq-right-col" role="region" aria-label="Frequently Asked Questions">
          {FAQ_DATA.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <article
                key={idx}
                className={`faq-card ${isOpen ? 'is-active' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleItem(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span className="faq-question-text">{item.question}</span>
                  <span
                    className={`faq-toggle-circle ${isOpen ? 'is-open' : ''}`}
                    aria-hidden="true"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <line
                        x1="12"
                        y1="5"
                        x2="12"
                        y2="19"
                        className={`faq-icon-vert ${isOpen ? 'is-collapsed' : ''}`}
                      />
                    </svg>
                  </span>
                </button>

                <div
                  id={`faq-answer-${idx}`}
                  className={`faq-answer-wrapper ${isOpen ? 'is-open' : ''}`}
                  role="region"
                >
                  <div className="faq-answer-inner">
                    <p className="faq-answer-text">{item.answer}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
