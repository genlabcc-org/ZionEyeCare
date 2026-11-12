import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import SiteHeader from '../components/SiteHeader';
import Hero from '../components/Hero';
import SEO from '../components/SEO';
import './HomePage.css';
import { useStore } from '../hooks/useStore';
import { getNavPath } from "../services/categoryRoute";


const ServiceSection = lazy(() => import('../components/ServiceSection'));
const NewArrivals = lazy(() => import('../components/NewArrivals'));
const EyewearFeatureSection = lazy(() => import('../components/EyewearFeatureSection'));
const CustomerExperiences = lazy(() => import('../components/CustomerExperiences'));
const SiteFooter = lazy(() => import('../components/SiteFooter'));

const SectionLoader = () => (
  <div style={{ height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  </div>
);

export default function HomePage() {
  const navigate = useNavigate();
  const categories = useStore(state => state.categories);
  const setSelectedProduct = useStore(state => state.setSelectedProduct);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    const pid = product?.product_id || product?.productId || product?.id;
    navigate(pid ? `/product/${pid}` : '/product');
  };

  const handleNavClick = (link, subName) => {
    if (link === 'Home') {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(getNavPath(link, categories, subName));
    }
  };

  return (
    <div className="homepage">
      <SEO
        title="Zion Eye Care Clinic | Eye Care & Vision"
        description="Discover premium optical lenses, eyeglasses, sunglasses, and protective frames at Zion Eye Care Clinic. High-quality vision solutions crafted for clarity and all-day comfort."
        canonical="https://www.zioneyecare.com"
        keywords={[
          'Zion Eye Care Clinic',
          'eye care',
          'vision',
          'eyeglasses',
          'sunglasses',
          'lenses',
          'single vision',
          'progressive lenses',
          'frames',
        ]}
      />
      <TopBar />
      <SiteHeader activeLink="Home" onLinkClick={handleNavClick} />
      <Hero />

      <Suspense fallback={<SectionLoader />}>
        <ServiceSection />
        <div id="new-arrivals">
          <NewArrivals onProductClick={handleProductClick} />
        </div>
        <EyewearFeatureSection />
        {/* <CollectionsSection /> */}
        <div id="reviews"><CustomerExperiences /></div>
        <SiteFooter />
      </Suspense>
    </div>
  );
}
