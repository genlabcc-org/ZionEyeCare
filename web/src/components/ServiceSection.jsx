import { FaGlasses } from "react-icons/fa";
import { FiActivity, FiArrowUpRight, FiEye } from "react-icons/fi";
import { Link } from "react-router-dom";
import "./ServiceSection.css";

const services = [
  {
    title: "Comprehensive eye exams",
    description: "Thoughtful vision checks for clearer, more comfortable sight.",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Optometrist providing an eye examination",
    Icon: FiEye,
  },
  {
    title: "Eyewear, made personal",
    description: "Expert frame fitting and prescription glasses for every day.",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Eyeglasses selected for everyday wear",
    Icon: FaGlasses,
  },
  {
    title: "Advanced lens solutions",
    description: "Lens options tailored to your prescription and lifestyle.",
    image:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Eye care professional discussing vision needs",
    Icon: FiActivity,
  },
];

export default function ServiceSection() {
  return (
    <section className="service-section" aria-labelledby="service-section-title">
      <div className="service-intro">
        <span className="service-eyebrow">
          <FiEye aria-hidden="true" />
          Our Services
        </span>
        <h2 id="service-section-title">Clear vision starts with expert care</h2>
        <p>
          From your first eye check to the right pair of glasses, we make
          looking after your vision feel personal.
        </p>
        <Link className="service-appointment-link" to="/contact">
          Book an appointment
          <span className="service-appointment-icon">
            <FiArrowUpRight aria-hidden="true" />
          </span>
        </Link>
      </div>

      <div className="service-list">
        {services.map(({ title, description, image, imageAlt, Icon }) => (
          <article className="service-card" key={title}>
            <div className="service-card-copy">
              <Icon className="service-card-icon" aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </div>
            <img src={image} alt={imageAlt} loading="lazy" decoding="async" />
          </article>
        ))}
      </div>
    </section>
  );
}
