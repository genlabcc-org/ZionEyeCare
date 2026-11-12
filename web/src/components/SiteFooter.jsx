import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa';
import './SiteFooter.css';

const SiteFooter = () => (
  <footer className="faywalk-footer">
    <div className="fw-footer-container">
      <div className="fw-footer-grid">
        <div className="fw-col fw-brand-col">
          <Link to="/" className="fw-logo-wrap" aria-label="Zion Eye Care Home">
            <img src="/zionlogo.png" alt="Zion Eye Care" className="fw-logo-img" />
          </Link>
          <p className="fw-brand-desc">Refined everyday essentials crafted for effortless elegance.</p>

          <div className="fw-socials">
            <h4 className="fw-col-title">Follow us</h4>
            <div className="fw-social-links">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <FaYoutube />
              </a>
            </div>
          </div>
        </div>

        <div className="fw-col fw-nav-col">
          <h4 className="fw-col-title">Information</h4>
          <ul className="fw-link-list">
            <li><Link to="/all-products">All Products</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>

        <div className="fw-col fw-nav-col">
          <h4 className="fw-col-title">Explore Zion</h4>
          <ul className="fw-link-list">
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/#new-arrivals">New Arrivals</Link></li>
            <li><Link to="/#best-sellers">Best Sellers</Link></li>
          </ul>
        </div>

        <div className="fw-col fw-nav-col fw-contact-col">
          <h4 className="fw-col-title">Contacts</h4>
          <ul className="fw-link-list">
            <li><a href="mailto:zionretina@gmail.com">zionretina@gmail.com</a></li>
            <li><a href="tel:+916379838682">+91 63798 38682</a></li>
          </ul>
        </div>
      </div>

      <div className="fw-footer-bottom">
        <p className="fw-copy">&copy; {new Date().getFullYear()} Zion Eye Care. All rights reserved.</p>
        <nav className="fw-legal-links" aria-label="Legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/all-products">Shop</Link>
        </nav>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
