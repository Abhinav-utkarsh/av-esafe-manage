import { useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  Sparkles,
  Code2,
  Rocket,
} from "lucide-react";

import "./ApplyNow.css";

export default function ApplyNow() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("apply-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
      }
    );

    section
      .querySelectorAll(".apply-reveal")
      .forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="apply-section"
      id="apply"
      ref={sectionRef}
    >
      <div className="apply-container">

        {/* Background Decorations */}
        <div className="apply-decoration apply-decoration-one"></div>
        <div className="apply-decoration apply-decoration-two"></div>

        <div className="apply-floating-icon apply-floating-icon-one">
          <Code2 size={24} />
        </div>

        <div className="apply-floating-icon apply-floating-icon-two">
          <Rocket size={24} />
        </div>

        {/* Main CTA Content */}
        <div className="apply-content apply-reveal">

          <span className="apply-eyebrow">
            <Sparkles size={15} />
            YOUR FUTURE STARTS HERE
          </span>

          <div className="apply-main-icon">
            <GraduationCap size={38} />
          </div>

          <h2>
            Ready to Build
            <span> Your Future in IT?</span>
          </h2>

          <p>
            Take the first step toward your career goals.
            Explore our training programs, develop practical
            skills, and prepare yourself for exciting
            opportunities in the IT industry.
          </p>

          <div className="apply-actions">
            <a
              href="#application-form"
              className="apply-primary-button"
            >
              Apply for Training
              <ArrowRight size={19} />
            </a>

            <a
              href="#tracks"
              className="apply-secondary-button"
            >
              Explore Programs
              <ArrowUpRight size={18} />
            </a>
          </div>

          <div className="apply-bottom-note">
            <span className="apply-note-dot"></span>

            <span>
              Start learning. Build skills. Move forward.
            </span>
          </div>

        </div>

      </div>
    </section>
  );
}