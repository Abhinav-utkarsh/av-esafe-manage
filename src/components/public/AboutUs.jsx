import { useEffect, useRef } from "react";
import {
  ArrowUpRight,
  Code2,
  Rocket,
  Users,
  BookOpen,
  Sparkles,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

import "./AboutUs.css";

export default function AboutUs() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("about-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
      }
    );

    section
      .querySelectorAll(".about-reveal")
      .forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Code2,
      title: "Practical Learning",
      description:
        "Learn through hands-on exercises, coding practice, and real-world technical concepts.",
    },
    {
      icon: BookOpen,
      title: "Structured Programs",
      description:
        "Follow organized learning paths designed to build knowledge step by step.",
    },
    {
      icon: Users,
      title: "Personalized Guidance",
      description:
        "Get structured support throughout your learning journey and training progress.",
    },
    {
      icon: Rocket,
      title: "Career Preparation",
      description:
        "Strengthen your technical skills, aptitude, resume, and interview readiness.",
    },
  ];

  return (
    <section
      className="about-section"
      id="about"
      ref={sectionRef}
    >
      <div className="about-container">
        {/* Section Header */}
        <div className="about-header about-reveal">
          <span className="about-eyebrow">
            <Sparkles size={15} />
            DISCOVER AV_eSAFE
          </span>

          <h2>
            More Than Learning.
            <span> A Step Towards Your Future.</span>
          </h2>

          <p>
            We believe that the right skills, practical experience,
            and consistent guidance can help students unlock
            their professional potential.
          </p>
        </div>

        {/* Main About Content */}
        <div className="about-main">
          {/* Left Content */}
          <div className="about-content about-reveal">
            <span className="about-content-label">
              WHO WE ARE
            </span>

            <h3>
              Empowering the next generation of
              <span> IT professionals.</span>
            </h3>

            <p>
              Av_eSAFE Training is a learning initiative focused
              on helping aspiring IT professionals develop
              practical technical skills and prepare for
              professional opportunities.
            </p>

            <p>
              Our programs bring together technical learning,
              structured assessments, and career preparation
              to create a meaningful learning experience.
            </p>

            <p>
              Whether you are starting your IT journey or
              strengthening your existing skills, Av_eSAFE
              aims to support your growth with a structured
              and learner-focused approach.
            </p>

            <a
              href="#tracks"
              className="about-explore-link"
            >
              Explore Our Programs
              <ArrowUpRight size={18} />
            </a>
          </div>

          {/* Right Visual */}
          <div className="about-visual about-reveal">
            <div className="about-visual-glow"></div>

            <div className="about-visual-card">
              <div className="about-visual-top">
                <div className="about-visual-brand">
                  <div className="about-brand-icon">
                    <Code2 size={23} />
                  </div>

                  <div>
                    <strong>Av_eSAFE</strong>
                    <span>Learn. Build. Grow.</span>
                  </div>
                </div>

                <span className="about-status">
                  <span className="about-status-dot"></span>
                  Learning Ecosystem
                </span>
              </div>

              <div className="about-visual-center">
                <div className="about-orbit about-orbit-one"></div>
                <div className="about-orbit about-orbit-two"></div>

                <div className="about-center-icon">
                  <GraduationCap size={54} />
                </div>

                <div className="about-orbit-icon about-orbit-icon-one">
                  <Code2 size={22} />
                </div>

                <div className="about-orbit-icon about-orbit-icon-two">
                  <BookOpen size={22} />
                </div>

                <div className="about-orbit-icon about-orbit-icon-three">
                  <Rocket size={22} />
                </div>
              </div>

              <div className="about-visual-bottom">
                <div>
                  <span>OUR APPROACH</span>
                  <h4>Skills That Move You Forward</h4>
                </div>

                <ShieldCheck size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="about-features">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                className="about-feature-card about-reveal"
                key={feature.title}
                style={{
                  "--about-index": index,
                }}
              >
                <div className="about-feature-icon">
                  <Icon size={23} />
                </div>

                <h4>{feature.title}</h4>

                <p>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}