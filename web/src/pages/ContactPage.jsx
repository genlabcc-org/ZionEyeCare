import React from 'react';
import TopBar from '../components/TopBar';
import SiteHeader from '../components/SiteHeader';
import ContactUs from '../components/ContactUs';
import SiteFooter from '../components/SiteFooter';
import SEO from '../components/SEO';

export default function ContactPage() {
  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Zion Eye Care Clinic Support',
    description: 'Contact Zion Eye Care Clinic for vision care appointments, optical lens inquiries, and eyewear consultations.',
    mainEntity: {
      '@type': 'Organization',
      name: 'Zion Eye Care Clinic',
      telephone: '+91-63798-38682',
      email: 'zionretina@gmail.com',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'A52 3RD Main Road, Maharajanagar, Palayamkottai',
        addressLocality: 'Tirunelveli',
        addressRegion: 'Tamil Nadu',
        postalCode: '627011',
        addressCountry: 'IN',
      },
    },
  };

  return (
    <div className="homepage">
      <SEO
        title="Contact Us | Zion Eye Care Clinic"
        description="Have questions about our eye tests, prescription lenses, or eyeglasses? Contact Zion Eye Care Clinic via email, phone, or visit our clinic. We are here to help."
        canonical="https://www.zioneyecare.com/contact"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Contact Us', path: '/contact' },
        ]}
        schema={contactSchema}
      />
      <TopBar />
      <SiteHeader activeLink="Contact Us" />
      <ContactUs />
      <SiteFooter />
    </div>
  );
}
