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

export default function Terms() {
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
        title="Terms of Service | Zion EyeCare"
        description="Read the Terms of Service for using the Zion EyeCare website, booking eye appointments, and purchasing optical products and lenses."
        canonical="https://www.zioneyecare.com/terms"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Terms of Service', path: '/terms' },
        ]}
      />
      <TopBar />
      <SiteHeader activeLink="" onLinkClick={handleHeaderLinkClick} />

      <section className="policy-section">
        <div className="policy-card">
          <span className="policy-badge">Legal</span>
          <h1 className="policy-h1">Terms of Service</h1>
          <p className="policy-updated">Last Updated: November 11, 2026</p>

          <p className="policy-intro">
            This document is an electronic record in accordance with the Information Technology Act, 2000 and the
            rules made thereunder, including any amendments made from time to time. Being a system-generated
            electronic record, this document does not require any physical or digital signature.
          </p>

          <p className="policy-p">
            By accessing or using the website{' '}
            <a href="https://www.zioneyecare.com" className="policy-link" target="_blank" rel="noopener noreferrer">
              www.zioneyecare.com
            </a>{' '}
            (&ldquo;Website&rdquo;) or the services of <strong>Zion EyeCare</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
            or &ldquo;our&rdquo;), you agree to carefully read, understand, and comply with these Terms of Service
            (&ldquo;Terms&rdquo;). These Terms apply whenever you access, browse, register, book an appointment, or make
            a purchase through the Website, or avail of our services at our clinic, using any computer, mobile device, or
            other electronic device.
          </p>

          <p className="policy-p">
            If you do not agree with these Terms, our Privacy Policy, or any other policies displayed on the Website or
            at our clinic, please do not use the Website or our services.
          </p>

          <p className="policy-p">
            By using the Website or our services, you acknowledge that you have read, understood, and agreed to be
            legally bound by these Terms and related policies, whether or not you create an account.
          </p>

          <p className="policy-p">
            As long as you comply with these Terms, Zion EyeCare grants you a personal, limited, revocable,
            non-exclusive, and non-transferable right to access and use the Website for booking appointments, learning
            about our services, and purchasing eyewear and related products for your personal use.
          </p>

          <h2 className="policy-h2">1. Acceptance of Terms</h2>
          <p className="policy-p">
            These Terms constitute a legally binding agreement between you and Zion EyeCare. By accessing or using the
            Website or our services, you agree to these Terms, our Privacy Policy, and any additional policies related
            to appointments, products, payments, offers, returns, exchanges, warranties, cancellations, and other
            services.
          </p>
          <p className="policy-p">
            Every time you access or use the Website or our services, you confirm your acceptance of these Terms and
            policies.
          </p>
          <p className="policy-p">
            If you do not wish to be bound by these Terms, you must stop using the Website immediately.
          </p>

          <h2 className="policy-h2">2. Eligibility of Users</h2>
          <p className="policy-p">
            The Website and our services may be used by individuals or business entities who are legally capable of
            entering into binding contracts under applicable laws.
          </p>
          <p className="policy-p">
            As per Indian law, users must be at least 18 years of age to register, book appointments, or make
            purchases through the Website.
          </p>
          <p className="policy-p">
            Children below 18 years of age may receive eye care services and use the Website only under the
            supervision and consent of a parent or legal guardian, who is responsible for the child&apos;s appointments,
            records, and purchases.
          </p>
          <p className="policy-p">
            You are responsible for ensuring that your use of the Website complies with all applicable laws and
            regulations.
          </p>

          <h2 className="policy-h2">3. Creating an Account</h2>
          <p className="policy-p">
            To access certain features of the Website, you may be required to create an account by providing accurate
            and complete information.
          </p>
          <ul className="policy-list">
            <li>
              You are responsible for maintaining the confidentiality of your account details, including your login
              credentials, and for all activities performed through your account.
            </li>
            <li>
              By creating an account, you authorise Zion EyeCare to collect and use your information as described in our
              Privacy Policy.
            </li>
            <li>
              You agree to provide accurate information and update your details whenever required.
            </li>
            <li>
              By registering on the Website, you consent to receive communications from Zion EyeCare, including
              appointment reminders, order updates, promotional offers, newsletters, and other service-related
              information.
            </li>
            <li>
              You may unsubscribe from promotional communications at any time.
            </li>
          </ul>

          <h2 className="policy-h2">4. Medical Services and Disclaimer</h2>
          <p className="policy-p">
            The information on our Website, including articles, tips, and product descriptions, is for general
            information only. It is not a substitute for a professional eye examination, diagnosis, or treatment.
          </p>
          <p className="policy-p">
            Only a proper eye examination by a qualified professional can determine your vision needs and eye health.
            Please do not rely on website content to diagnose or treat any eye condition.
          </p>
          <p className="policy-p">
            If you experience a sudden loss of vision, severe eye pain, injury, or any other eye emergency, seek
            immediate medical attention at the nearest hospital or emergency facility. Our Website and appointment
            system are not meant for emergencies.
          </p>
          <p className="policy-p">
            You are responsible for giving us accurate and complete information about your health, symptoms, and medical
            history, so that we can provide appropriate care. Treatment outcomes can vary from person to person, and we
            do not guarantee specific results.
          </p>

          <h2 className="policy-h2">5. Appointments</h2>
          <p className="policy-p">
            Appointments can be booked through the Website, by phone, or in person, subject to availability.
          </p>
          <ul className="policy-list">
            <li>
              Please arrive on time. If you are late, we may need to shorten or reschedule your appointment so that other
              patients are not affected.
            </li>
            <li>
              Please inform us at least 24 hours in advance if you need to cancel or reschedule an appointment.
            </li>
            <li>
              Repeated missed appointments without notice may affect your ability to book future appointments online.
            </li>
            <li>
              We reserve the right to reschedule or cancel an appointment due to doctor unavailability, emergencies, or
              other unavoidable circumstances. In such cases, we will inform you and offer an alternative time.
            </li>
            <li>
              Consultation or examination fees paid for services already provided are generally non-refundable, except
              as required by law.
            </li>
          </ul>

          <h2 className="policy-h2">6. Prescriptions</h2>
          <p className="policy-p">
            Prescriptions issued by Zion EyeCare are based on your eye examination on the date of the visit. Eyesight
            can change over time, so we recommend regular check-ups as advised by your eye care professional.
          </p>
          <p className="policy-p">
            Prescriptions are valid only for the period mentioned on them or as advised by the doctor. Zion EyeCare is
            not responsible for any issues arising from the use of expired prescriptions or prescriptions obtained
            elsewhere that we have not verified.
          </p>

          <h2 className="policy-h2">7. Limitation of Liability</h2>
          <p className="policy-p">
            To the maximum extent permitted by applicable law, Zion EyeCare shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from the use of or inability to use the
            Website or our services.
          </p>
          <p className="policy-p">
            Zion EyeCare shall not be responsible for losses caused due to technical issues, website interruptions,
            payment gateway failures, unauthorised access, data loss, or other circumstances beyond our reasonable
            control.
          </p>
          <p className="policy-p">
            Nothing in these Terms excludes or limits any liability that cannot be excluded or limited under
            applicable law.
          </p>

          <h2 className="policy-h2">8. Copyrights and Intellectual Property</h2>
          <p className="policy-p">
            All content available on this Website, including but not limited to trademarks, brand names, logos, product
            images, designs, text, graphics, website layout, icons, source code, and other materials, are the exclusive
            property of Zion EyeCare unless otherwise stated.
          </p>
          <p className="policy-p">
            Users are prohibited from copying, reproducing, modifying, distributing, selling, or commercially
            exploiting any content from the Website without prior written permission from Zion EyeCare.
          </p>
          <p className="policy-p">
            Any unauthorised use of Website content may result in legal action.
          </p>

          <h2 className="policy-h2">9. Payments</h2>
          <p className="policy-p">
            Zion EyeCare uses trusted third-party payment gateways to process online payments, and may also accept
            payments at the clinic through cash, cards, or UPI.
          </p>
          <p className="policy-p">
            While we take reasonable measures to ensure secure transactions, Zion EyeCare is not responsible for
            delays, failures, or errors caused by third-party payment service providers, banking networks, or technical
            issues beyond our control.
          </p>
          <p className="policy-p">
            Customers are responsible for providing accurate payment and billing information during transactions.
          </p>

          <h2 className="policy-h2">10. Order Cancellation Policy</h2>
          <p className="policy-p">
            Zion EyeCare reserves the right to cancel an order under certain circumstances, including:
          </p>
          <ul className="policy-list">
            <li>Incorrect product information or pricing errors</li>
            <li>Product unavailability or stock issues</li>
            <li>Invalid or unverifiable prescription details</li>
            <li>Quantity limitations</li>
            <li>Suspicious or fraudulent transactions</li>
            <li>Issues identified during order verification</li>
          </ul>
          <p className="policy-p">
            If an order is cancelled after payment has been completed, the eligible amount will be refunded through the
            original payment method as per applicable refund timelines.
          </p>

          <h2 className="policy-h2">11. Cancellation by Customer</h2>
          <p className="policy-p">
            Customers may request cancellation of an order before the product has been processed or shipped.
          </p>
          <p className="policy-p">
            Customised products, such as prescription lenses and made-to-order eyewear, are made specifically for you.
            Once production has started, cancellation may not be possible or may be subject to charges.
          </p>
          <p className="policy-p">
            Once an order has been dispatched, cancellation requests may not be accepted.
          </p>
          <p className="policy-p">
            Zion EyeCare reserves the right to review cancellation requests based on order status and applicable
            policies.
          </p>

          <h2 className="policy-h2">12. Returns, Exchanges, and Warranty</h2>
          <p className="policy-p">
            Returns, exchanges, and warranty claims are subject to our Returns and Warranty Policy. We offer dedicated
            assistance for adaptation or re-check periods for new optical lenses, frame warranty coverage against
            manufacturing defects, and exchange support.
          </p>
          <p className="policy-p">
            Prescription lenses and contact lenses are personal-use products made or supplied for your specific needs,
            and may not be eligible for return once opened, used, or customised, except in case of manufacturing defects
            or errors on our part.
          </p>

          <h2 className="policy-h2">13. Fraudulent or Declined Transactions</h2>
          <p className="policy-p">
            Zion EyeCare reserves the right to take appropriate action against users involved in fraudulent activities,
            including unauthorised payment methods, misuse of offers, or suspicious transactions.
          </p>
          <p className="policy-p">
            The company may recover any losses, costs, or damages caused due to fraudulent activities and may initiate
            legal action wherever necessary.
          </p>

          <h2 className="policy-h2">14. Product Colours and Images</h2>
          <p className="policy-p">
            Zion EyeCare makes every effort to display product images and colours as accurately as possible.
          </p>
          <p className="policy-p">
            However, actual product colours, frame sizes, and finishes may vary slightly depending on device screens,
            display settings, lighting conditions, and photography effects.
          </p>
          <p className="policy-p">
            Zion EyeCare does not guarantee that the colour displayed on your device will exactly match the actual
            product. We recommend trying frames in person at our clinic where possible.
          </p>

          <h2 className="policy-h2">15. Feedback and Reviews</h2>
          <p className="policy-p">
            Customers are encouraged to share genuine feedback and reviews about their experience.
          </p>
          <p className="policy-p">
            Reviews help Zion EyeCare improve its products and services and help other customers make informed
            decisions.
          </p>
          <p className="policy-p">
            Customers must ensure that their reviews are honest, respectful, and do not contain misleading information,
            offensive content, or false claims. Please do not share personal medical details of yourself or others in
            public reviews.
          </p>
          <p className="policy-p">
            Zion EyeCare reserves the right to remove inappropriate reviews or restrict accounts involved in misuse of
            the review system.
          </p>

          <h2 className="policy-h2">16. Governing Law and Jurisdiction</h2>
          <p className="policy-p">
            These Terms are governed by the laws of India. Any disputes arising from these Terms or your use of the
            Website or our services shall be subject to the exclusive jurisdiction of the courts at{' '}
            <strong>Kanyakumari District, Tamil Nadu</strong>.
          </p>

          <h2 className="policy-h2">17. Changes to These Terms</h2>
          <p className="policy-p">
            We may update these Terms from time to time. Updates will be posted on this page with the revised
            &ldquo;Last Updated&rdquo; date. Your continued use of the Website or our services after changes are posted
            means you accept the updated Terms.
          </p>

          <div className="policy-contact-block">
            <h2 className="policy-h2">18. Contact Us</h2>
            <p className="policy-p">
              For any questions, concerns, or support regarding these Terms, please contact Zion EyeCare through the
              details below or those provided on the Website:
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
              Phone: NA
              <br />
              Address: Zion Eye Care Clinic, 5/3/1, Abel Multispeciality Clinic, Opposite to Muthalakurichy Bus Stop, Eraniel - Thuckala Rd, Kollemvillai, Muthalakurichi, Kanyakumari District, Tamil Nadu 629175.
            </p>
          </div>
        </div>
      </section>

      <Suspense fallback={<LoadingSkeleton height="300px" />}>
        <SiteFooter />
      </Suspense>
    </div>
  );
}
