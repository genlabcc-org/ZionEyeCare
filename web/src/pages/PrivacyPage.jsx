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

export default function Privacy() {
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
        title="Privacy Policy | Zion EyeCare"
        description="Learn how Zion EyeCare collects, uses, stores, and protects your personal information and eye health records."
        canonical="https://www.zioneyecare.com/privacy"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Privacy Policy', path: '/privacy' },
        ]}
      />
      <TopBar />
      <SiteHeader activeLink="" onLinkClick={handleHeaderLinkClick} />

      <section className="policy-section">
        <div className="policy-card">
          <span className="policy-badge">Legal &amp; Privacy</span>
          <h1 className="policy-h1">Privacy Policy</h1>
          <p className="policy-updated">Last Updated: November 11, 2026</p>

          <p className="policy-intro">
            This Privacy Policy explains how <strong>Zion EyeCare</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses,
            stores, and protects your personal information when you visit our clinic or website (
            <a href="https://www.zioneyecare.com" className="policy-link" target="_blank" rel="noopener noreferrer">
              www.zioneyecare.com
            </a>
            ), book an appointment, use our eye care services, or purchase eyewear and related products.
          </p>

          <p className="policy-p">
            For the purpose of this Privacy Policy, &ldquo;you&rdquo; and &ldquo;your&rdquo; refer to any patient, customer, visitor, or
            individual whose information we collect through our clinic, Website, or services.
          </p>

          <p className="policy-p">
            Please read this Privacy Policy carefully to understand how we handle your personal information.
          </p>

          <h2 className="policy-h2">Changes to This Privacy Policy</h2>
          <p className="policy-p">
            We may update this Privacy Policy from time to time to reflect changes in our practices, services, legal
            requirements, or regulatory obligations.
          </p>
          <p className="policy-p">
            Any updates will be posted on this page with the revised &ldquo;Last Updated&rdquo; date. We encourage you to
            review this Privacy Policy periodically.
          </p>

          <h2 className="policy-h2">How We Collect and Use Your Personal Information</h2>
          <p className="policy-p">
            To provide and improve our services, we collect personal information from you through different channels
            depending on how you interact with us, such as in-person visits, phone calls, our Website, WhatsApp, or
            email.
          </p>
          <p className="policy-p">We use your information to:</p>
          <ul className="policy-list">
            <li>Schedule and manage appointments</li>
            <li>Provide eye examinations, consultations, and treatment</li>
            <li>Prepare and fulfil orders for spectacles, lenses, contact lenses, and other products</li>
            <li>Provide customer and patient support</li>
            <li>Send appointment reminders, follow-up notices, and order updates</li>
            <li>Improve our services and patient experience</li>
            <li>Send promotional offers and updates (with your consent)</li>
            <li>Prevent fraudulent activities</li>
            <li>Comply with applicable legal and medical record-keeping requirements</li>
          </ul>

          <h2 className="policy-h2">Information We Collect Directly from You</h2>
          <p className="policy-p">
            When you visit us, create an account, book an appointment, place an order, or contact us, we may collect the
            following information:
          </p>

          <p className="policy-p" style={{ marginBottom: 6, fontWeight: 700, color: 'var(--policy-text-main)' }}>
            Personal Details:
          </p>
          <ul className="policy-sub-list">
            <li>Name</li>
            <li>Age and gender</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Billing address</li>
            <li>Shipping or delivery address</li>
          </ul>

          <p className="policy-p" style={{ marginBottom: 6, fontWeight: 700, color: 'var(--policy-text-main)' }}>
            Health and Eye Care Information:
          </p>
          <ul className="policy-sub-list">
            <li>Eye examination results and vision test records</li>
            <li>Spectacle and contact lens prescriptions</li>
            <li>Medical history relevant to your eye health (for example, existing eye conditions, allergies, or medications you share with us)</li>
            <li>Treatment details, recommendations, and follow-up notes</li>
          </ul>

          <p className="policy-p" style={{ marginBottom: 6, fontWeight: 700, color: 'var(--policy-text-main)' }}>
            Appointment and Order Information:
          </p>
          <ul className="policy-sub-list">
            <li>Appointment history</li>
            <li>Products purchased (frames, lenses, contact lenses, accessories)</li>
            <li>Order history</li>
            <li>Payment confirmation details</li>
            <li>Delivery information</li>
            <li>Return, exchange, or warranty details</li>
          </ul>

          <p className="policy-p" style={{ marginBottom: 6, fontWeight: 700, color: 'var(--policy-text-main)' }}>
            Account Information (if applicable):
          </p>
          <ul className="policy-sub-list">
            <li>Username</li>
            <li>Password</li>
            <li>Account preferences</li>
            <li>Saved account details</li>
          </ul>

          <p className="policy-p" style={{ marginBottom: 6, fontWeight: 700, color: 'var(--policy-text-main)' }}>
            Customer Support Information:
          </p>
          <p className="policy-p">
            Any information you provide when contacting us regarding appointments, prescriptions, orders, products,
            returns, exchanges, or other queries.
          </p>

          <h2 className="policy-h2">Information We Collect from Third Parties</h2>
          <p className="policy-p">
            We may receive information from trusted third-party service providers who support our operations, including:
          </p>
          <ul className="policy-list">
            <li>Payment gateway providers for processing payments securely</li>
            <li>Shipping and delivery partners for order fulfilment</li>
            <li>Lens and frame laboratories or suppliers who help us prepare your eyewear</li>
            <li>Appointment, billing, or practice-management software providers</li>
            <li>Website service providers and technology platforms</li>
          </ul>
          <p className="policy-p">
            Any information collected from third parties will be handled according to this Privacy Policy.
          </p>

          <h2 className="policy-h2">How We Use Your Personal Information</h2>
          <p className="policy-p" style={{ fontWeight: 700, color: 'var(--policy-text-main)', marginBottom: 4 }}>
            Providing Care, Products, and Services:
          </p>
          <p className="policy-p">
            We use your personal information to conduct eye examinations, maintain your records, prepare prescriptions,
            process orders, complete payments, arrange delivery, manage returns and exchanges, and provide support.
          </p>

          <p className="policy-p" style={{ fontWeight: 700, color: 'var(--policy-text-main)', marginBottom: 4 }}>
            Communication:
          </p>
          <p className="policy-p">We may use your information to send:</p>
          <ul className="policy-list">
            <li>Appointment confirmations and reminders</li>
            <li>Prescription or follow-up reminders</li>
            <li>Order and delivery updates</li>
            <li>Customer support responses</li>
            <li>Important service notifications</li>
          </ul>
          <p className="policy-p">
            With your permission, we may also send promotional offers, product updates, and eye health tips.
          </p>

          <p className="policy-p" style={{ fontWeight: 700, color: 'var(--policy-text-main)', marginBottom: 4 }}>
            Improving Our Services:
          </p>
          <p className="policy-p">
            We use information to understand patient and customer needs, improve our clinic and Website experience,
            enhance our products, and provide better care.
          </p>

          <p className="policy-p" style={{ fontWeight: 700, color: 'var(--policy-text-main)', marginBottom: 4 }}>
            Security and Fraud Prevention:
          </p>
          <p className="policy-p">
            We may use your information to detect, investigate, and prevent fraudulent transactions, unauthorised
            access, or misuse of our services.
          </p>

          <h2 className="policy-h2">How We Share Your Personal Information</h2>
          <p className="policy-p">
            We share your information only when necessary to provide our services, and we do not sell your personal
            information. This may include:
          </p>

          <p className="policy-p" style={{ fontWeight: 700, color: 'var(--policy-text-main)', marginBottom: 4 }}>
            Service Providers:
          </p>
          <ul className="policy-sub-list">
            <li>Payment processors</li>
            <li>Shipping and delivery partners</li>
            <li>Lens and frame laboratories or suppliers</li>
            <li>Website hosting and software providers</li>
            <li>Customer support providers</li>
          </ul>

          <p className="policy-p" style={{ fontWeight: 700, color: 'var(--policy-text-main)', marginBottom: 4 }}>
            Healthcare Professionals:
          </p>
          <p className="policy-p">
            With your consent, we may share relevant records with other doctors or healthcare providers involved in your
            care, for example, when you are referred to a specialist.
          </p>

          <p className="policy-p" style={{ fontWeight: 700, color: 'var(--policy-text-main)', marginBottom: 4 }}>
            Legal Requirements:
          </p>
          <p className="policy-p">
            We may disclose your information if required by law, legal process, or government authorities, or to protect
            our rights, patients, customers, or Website security.
          </p>

          <p className="policy-p" style={{ fontWeight: 700, color: 'var(--policy-text-main)', marginBottom: 4 }}>
            Business Operations:
          </p>
          <p className="policy-p">
            In case of business changes such as mergers, acquisitions, or restructuring, your information may be
            transferred as part of the business assets, subject to this Privacy Policy.
          </p>

          <h2 className="policy-h2">Sensitive Health Information</h2>
          <p className="policy-p">
            We understand that your eye health and prescription records are sensitive. We handle this information with
            additional care, limit access to staff who need it to provide your care, and use it only for the purposes
            described in this Privacy Policy or as you have consented.
          </p>

          <h2 className="policy-h2">Payment Information</h2>
          <p className="policy-p">
            Payments made through our Website or clinic may be processed through third-party payment gateways or
            payment terminals.
          </p>
          <p className="policy-p">
            <strong>Zion EyeCare does not directly store your complete payment card or banking details.</strong>
          </p>
          <p className="policy-p">
            Payment service providers process your payment information according to their own privacy policies and
            security practices.
          </p>

          <h2 className="policy-h2">Cookies and Website Usage</h2>
          <p className="policy-p">
            Our Website may use cookies and similar technologies to keep the site working properly, remember your
            preferences, and understand how visitors use it. You can control cookies through your browser settings, though
            some features may not work properly if cookies are disabled.
          </p>

          <h2 className="policy-h2">User Reviews and Content</h2>
          <p className="policy-p">
            If you submit reviews, feedback, images, or other content on our Website or social media pages, such
            information may be visible to others.
          </p>
          <p className="policy-p">
            You are responsible for ensuring that the content you share is accurate and does not violate the rights of
            others. Please avoid sharing sensitive medical details in public reviews.
          </p>
          <p className="policy-p">
            Zion EyeCare reserves the right to remove inappropriate, misleading, or harmful content.
          </p>

          <h2 className="policy-h2">Third-Party Websites and Links</h2>
          <p className="policy-p">
            Our Website may contain links to third-party websites, services, or platforms.
          </p>
          <p className="policy-p">
            Zion EyeCare is not responsible for the privacy practices, security, or content of external websites. We
            recommend reviewing their privacy policies before sharing personal information.
          </p>

          <h2 className="policy-h2">Children&apos;s Privacy</h2>
          <p className="policy-p">
            Our Website is not intended for individuals below the age of 18 to use independently.
          </p>
          <p className="policy-p">
            We may provide eye care services to children, in which case their information is collected from and managed
            through a parent or legal guardian, whose consent we obtain before collecting or using the child&apos;s personal
            information.
          </p>
          <p className="policy-p">
            If you believe a child&apos;s information has been provided without appropriate consent, please contact us and we
            will take the necessary steps to remove it.
          </p>

          <h2 className="policy-h2">Security and Retention of Information</h2>
          <p className="policy-p">
            We take reasonable measures to protect your personal information from unauthorised access, misuse, loss, or
            disclosure, including restricted access to records and secure storage systems.
          </p>
          <p className="policy-p">However, no clinic system or online platform can guarantee complete security.</p>
          <p className="policy-p">We retain your information only for as long as necessary to:</p>
          <ul className="policy-list">
            <li>Provide our services and ongoing care</li>
            <li>Maintain medical and business records</li>
            <li>Comply with legal and regulatory obligations</li>
            <li>Resolve disputes</li>
            <li>Enforce agreements</li>
          </ul>

          <h2 className="policy-h2">Your Rights</h2>
          <p className="policy-p">
            Depending on applicable laws, including the <strong>Digital Personal Data Protection Act, 2023</strong>, you may
            have the following rights regarding your personal information:
          </p>

          <p className="policy-p" style={{ fontWeight: 700, color: 'var(--policy-text-main)', marginBottom: 4 }}>
            Right to Access:
          </p>
          <p className="policy-p">You may request a summary of the personal information we hold about you.</p>

          <p className="policy-p" style={{ fontWeight: 700, color: 'var(--policy-text-main)', marginBottom: 4 }}>
            Right to Correction:
          </p>
          <p className="policy-p">You may request correction of inaccurate or incomplete information.</p>

          <p className="policy-p" style={{ fontWeight: 700, color: 'var(--policy-text-main)', marginBottom: 4 }}>
            Right to Erasure:
          </p>
          <p className="policy-p">
            You may request deletion of your personal information, subject to legal and medical record-keeping
            requirements.
          </p>

          <p className="policy-p" style={{ fontWeight: 700, color: 'var(--policy-text-main)', marginBottom: 4 }}>
            Right to Withdraw Consent:
          </p>
          <p className="policy-p">
            You may withdraw your consent for the use of your information, including for promotional communications, at
            any time.
          </p>

          <p className="policy-p" style={{ fontWeight: 700, color: 'var(--policy-text-main)', marginBottom: 4 }}>
            Right to Nominate:
          </p>
          <p className="policy-p">
            You may nominate another person to exercise your rights on your behalf in the event of your death or
            incapacity.
          </p>

          <p className="policy-p" style={{ fontWeight: 700, color: 'var(--policy-text-main)', marginBottom: 4 }}>
            Managing Communication Preferences:
          </p>
          <p className="policy-p">
            You may unsubscribe from promotional emails or messages using the options provided or by contacting us.
          </p>

          <h2 className="policy-h2">Complaints and Grievances</h2>
          <p className="policy-p">
            If you have concerns about how your personal information is handled, please contact us using the details below.
            We will review and respond within a reasonable timeframe:
          </p>
          <p className="policy-p">
            <strong>Grievance Officer:</strong> Grievance Officer, Zion EyeCare
            <br />
            <strong>Email:</strong>{' '}
            <a href="mailto:zionretina@gmail.com" className="policy-link">
              zionretina@gmail.com
            </a>
          </p>

          <div className="policy-contact-block">
            <h2 className="policy-h2">Contact Us</h2>
            <p className="policy-p">
              If you have any questions about this Privacy Policy or wish to exercise your privacy rights, please contact
              us:
            </p>
            <p className="policy-p" style={{ marginBottom: 0 }}>
              <strong>Zion EyeCare</strong>
              <br />
              Website:{' '}
              <a href="https://www.zioneyecare.com" className="policy-link" target="_blank" rel="noopener noreferrer">
                www.zioneyecare.com
              </a>
              <br />
              Email:{' '}
              <a href="mailto:zionretina@gmail.com" className="policy-link">
                zionretina@gmail.com
              </a>
              <br />
              Phone:{' '}
              <a href="tel:+916379838682" className="policy-link">
                +91 63798 38682
              </a>
              <br />
              Address: Zion Eye Care Clinic, A52 3RD Main Road, Maharajanagar, Palayamkottai, Tirunelveli &ndash; 627011, Tamil Nadu, India.
            </p>
          </div>

          <p className="policy-p" style={{ marginTop: 24, fontStyle: 'italic' }}>
            For applicable data protection laws, Zion EyeCare acts as the data fiduciary (controller) of your personal
            information.
          </p>
        </div>
      </section>

      <Suspense fallback={<LoadingSkeleton height="300px" />}>
        <SiteFooter />
      </Suspense>
    </div>
  );
}
