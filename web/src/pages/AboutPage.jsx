import React, { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import './Policy.css';
import SiteHeader from '../components/SiteHeader';
import TopBar from '../components/TopBar';
import SEO from '../components/SEO';
import { useStore } from '../hooks/useStore';
import { getNavPath } from '../services/categoryRoute';

const SiteFooter = lazy(() => import('../components/SiteFooter'));

const LoadingSkeleton = ({ height = '200px' }) => (
  <div style={{ height, background: '#f5f5f5', borderRadius: '8px', margin: '16px 0' }} />
);

export default function AboutPage() {
  const navigate = useNavigate();
  const categories = useStore((state) => state.categories);

  const handleHeaderLinkClick = (link, subName) => {
    if (link === 'Home') {
      navigate('/');
    } else {
      navigate(getNavPath(link, categories, subName));
    }
  };

  return (
    <div className="policy-root">
      <SEO
        title="About Us | Zion Eye Care Clinic – Eye Care & Vision"
        description="Zion Eye Care Clinic provides advanced optical lenses, comprehensive vision diagnostics, and high-quality frames for clear and comfortable vision."
        canonical="https://www.zioneyecare.com/about"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'About Us', path: '/about' },
        ]}
      />
      <TopBar />
      <SiteHeader activeLink="About Zion Eye Care" onLinkClick={handleHeaderLinkClick} />

      <section className="policy-section">
        <div className="policy-card about-card">
          {/* Top Logo */}
          <div className="about-logo-header">
            <img src="/zionlogo.png" alt="Zion Eye Care Logo" className="about-top-logo" />
          </div>

          <div className="about-header-center">
            <span className="policy-badge">Precision Eye Care · Optical Excellence</span>
            <h1 className="policy-h1">About Zion Eye Care Clinic</h1>
          </div>

          <p className="policy-intro about-lead">
            At <strong>Zion Eye Care Clinic</strong>, we are committed to safeguarding and enhancing the gift of sight.
            Founded with a passion for clinical accuracy, compassionate service, and modern optical innovation, we
            provide comprehensive eye care and personalized vision solutions for individuals and families.
          </p>

          <p className="policy-p">
            Clear, comfortable vision is foundational to everyday life — from reading and driving to screen work and
            enjoying the outdoors. Our clinic is equipped with advanced computerized refraction and diagnostic instruments
            that allow our experienced optometrists to assess your visual acuity, eye strain levels, and overall ocular health
            with unmatched precision.
          </p>

          <p className="policy-p">
            We offer an extensive selection of internationally certified ophthalmic lenses tailored to your prescription
            and lifestyle needs. Whether you need single vision lenses, advanced digital progressive lenses, blue-light
            filtering coatings for digital devices, occupational bifocals, or sun-protective prescription sunglasses,
            we partner with premier optical laboratories to deliver crystal-clear clarity and effortless visual comfort.
          </p>

          <p className="policy-p">
            In addition to high-performance lenses, we curate a versatile collection of premium eyeglass frames for Men,
            Women, and Juniors — blending lightweight ergonomics, durability, and contemporary style. Our dedicated optical
            specialists guide each patient through tailored frame styling, accurate pupillary distance (PD) measurements,
            and precise fitting to ensure your glasses feel as good as they look.
          </p>

          <div className="policy-contact-block about-vision-block">
            <h2 className="policy-h2">OUR VISION</h2>
            <p className="policy-p" style={{ marginBottom: 16 }}>
              To be the most trusted and caring optical destination in the region, recognized for diagnostic precision,
              state-of-the-art lens technologies, and patient-first service that enriches quality of life through better vision.
            </p>
            <h2 className="policy-h2" style={{ marginTop: 20 }}>OUR MISSION</h2>
            <p className="policy-p" style={{ marginBottom: 0 }}>
              To empower every patient with clear, comfortable, and healthy vision by delivering thorough clinical eye examinations,
              high-quality custom-crafted eyewear, and expert eye care guidance with warmth, integrity, and affordability.
            </p>
          </div>

          <div className="about-tagline-footer">
            <span>Zion Eye Care Clinic – Clear Vision for a Brighter Tomorrow</span>
          </div>
        </div>
      </section>

      <Suspense fallback={<LoadingSkeleton height="300px" />}>
        <SiteFooter />
      </Suspense>
    </div>
  );
}

