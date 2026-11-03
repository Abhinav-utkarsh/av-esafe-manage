import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import "./Hero.css";

export default function Hero() {
  const handleApplyClick = () => {
    const form = document.getElementById("application-form");

    if (form) {
      form.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <section className="public-hero">
      <div className="hero-glow hero-glow-one" />
      <div className="hero-glow hero-glow-two" />

      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={15} />
            <span>Av_eSAFE Training & Placement Support</span>
          </div>

          <h1>
            Your Future.
            <br />
            Your Skills.
            <br />
            <span>Your Opportunity.</span>
          </h1>

          <p className="hero-description">
            Build industry-ready skills, work on practical projects, and
            prepare yourself for the opportunities waiting in the IT industry.
          </p>

          <div className="hero-actions">
            <Link to="/founder" className="hero-primary-btn">
              Meet Our Founder
              <ArrowRight size={18} />
            </Link>

            <button
              type="button"
              className="hero-secondary-btn"
              onClick={handleApplyClick}
            >
              Apply Now
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="hero-trust">
            <div className="hero-trust-avatars">
              <span>A</span>
              <span>E</span>
              <span>S</span>
              <span>+</span>
            </div>

            <div className="hero-trust-text">
              <strong>Learn. Practice. Grow.</strong>
              <span>Start your journey with Av_eSAFE</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />

          <div className="hero-glass-card">
            <div className="hero-card-top">
              <div className="hero-card-brand">
                <div className="hero-brand-icon">
                  <Sparkles size={19} />
                </div>
                <div>
                  <strong>Av_eSAFE</strong>
                  <span>Learning Experience</span>
                </div>
              </div>

              <span className="hero-live-indicator">
                <span />
                Ready to Learn
              </span>
            </div>

            <div className="hero-card-main">
              <span className="hero-card-eyebrow">YOUR LEARNING JOURNEY</span>

              <h2>
                Learn Skills.
                <br />
                Build Your Future.
              </h2>

              <p>
                Turn your potential into practical knowledge with structured
                learning and career-focused training.
              </p>
            </div>

            <div className="hero-card-progress">
              <div className="hero-progress-heading">
                <span>Your Growth Starts Here</span>
                <Sparkles size={15} />
              </div>

              <div className="hero-progress-track">
                <div className="hero-progress-fill" />
              </div>

              <div className="hero-progress-footer">
                <span>Skills</span>
                <span>Projects</span>
                <span>Career</span>
              </div>
            </div>
          </div>

          <div className="hero-floating-card hero-float-top">
            <div className="hero-floating-icon blue-icon">
              <Sparkles size={17} />
            </div>
            <div>
              <strong>Practical Learning</strong>
              <span>Skills that matter</span>
            </div>
          </div>

          <div className="hero-floating-card hero-float-bottom">
            <div className="hero-floating-icon purple-icon">
              <ArrowRight size={17} />
            </div>
            <div>
              <strong>Career Focused</strong>
              <span>Grow with confidence</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-bottom-label">
        <span>LEARN</span>
        <i />
        <span>BUILD</span>
        <i />
        <span>GROW</span>
      </div>
    </section>
  );
}