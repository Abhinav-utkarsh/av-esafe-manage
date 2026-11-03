
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  Lightbulb,
  MessageCircle,
  Rocket,
  Target,
  Users,
  X,
} from "lucide-react";

import Navbar from "../../components/public/Navbar";
import "./OurMentors.css";

const mentorBenefits = [
  {
    icon: BriefcaseBusiness,
    title: "Industry Insights",
    description:
      "Understand workplace expectations, software development practices, and how technical knowledge is applied in real projects.",
    details:
      "Discover how software teams approach requirements, collaborate across roles, test applications, investigate issues, and deliver solutions. Industry-focused examples can help you understand why technical concepts matter in a professional environment.",
    points: [
      "Understand real-world software workflows.",
      "Explore practical industry scenarios.",
      "Learn professional development and testing practices.",
    ],
  },
  {
    icon: BookOpen,
    title: "Practical Learning",
    description:
      "Strengthen your fundamentals through guided exercises, coding practice, projects, and practical examples.",
    details:
      "Move beyond theory by applying what you learn. Guided exercises and project-oriented activities help you practise concepts, identify mistakes, and develop a stronger understanding of the technologies you study.",
    points: [
      "Practise concepts through hands-on exercises.",
      "Build confidence by working on projects.",
      "Improve problem-solving through practical tasks.",
    ],
  },
  {
    icon: MessageCircle,
    title: "Guidance & Feedback",
    description:
      "Get help understanding difficult concepts, improving your approach, and identifying areas for growth.",
    details:
      "Learning is easier when you can ask questions and receive constructive feedback. Mentorship can help you clarify confusing topics, review your approach to a problem, and identify what to improve next.",
    points: [
      "Clarify difficult technical concepts.",
      "Receive constructive learning feedback.",
      "Identify strengths and areas for improvement.",
    ],
  },
  {
    icon: Rocket,
    title: "Career Readiness",
    description:
      "Prepare for interviews and professional opportunities with technical guidance and career development support.",
    details:
      "Prepare for the transition from learning to work with guidance on technical interviews, resume preparation, communication, and explaining your projects and skills clearly.",
    points: [
      "Prepare for technical interviews.",
      "Learn to present your skills and projects.",
      "Build professional confidence and communication.",
    ],
  },
];

const mentorProfiles = [
  {
    number: "01",
    icon: BriefcaseBusiness,
    title: "Experienced Mentors",
    description:
      "Learn from experienced professionals, including mentors with 10+ years of industry experience where available, who can share valuable workplace perspectives.",
    tag: "Experience-led learning",
  },
  {
    number: "02",
    icon: Target,
    title: "Domain Experts",
    description:
      "Build your understanding with guidance from professionals knowledgeable in their respective technologies, tools, and technical domains.",
    tag: "Domain-focused guidance",
  },
  {
    number: "03",
    icon: BookOpen,
    title: "Hands-on Trainers",
    description:
      "Move beyond theory with coding exercises, guided practice, projects, and examples that help you apply what you learn.",
    tag: "Learn by doing",
  },
  {
    number: "04",
    icon: Rocket,
    title: "Career Guides",
    description:
      "Develop interview skills, improve your resume, strengthen communication, and learn how to prepare for IT opportunities.",
    tag: "Career development",
  },
];

const mentorPrinciples = [
  "Learn technical concepts in simple, understandable ways.",
  "Connect classroom knowledge with industry expectations.",
  "Practise through exercises, examples, and projects.",
  "Receive constructive guidance to improve your skills.",
  "Build confidence for interviews and professional growth.",
];

export default function OurMentors() {
  const [activeBenefit, setActiveBenefit] = useState(null);

  const closeModal = () => setActiveBenefit(null);

  return (
    <main className="mentors-page">
      <Navbar />

      {/* HERO SECTION */}
      <section className="mentors-hero">
        <div className="mentors-orb mentors-orb-one" />
        <div className="mentors-orb mentors-orb-two" />

        <div className="mentors-container mentors-hero-grid">
          <div className="mentors-hero-content">
            <span className="mentors-eyebrow">
              <Users size={16} />
              LEARN WITH GUIDANCE
            </span>

            <h1>
              Learn from experience.
              <span>Grow with confidence.</span>
            </h1>

            <p className="mentors-hero-description">
              Your learning journey deserves the right guidance.
              At Av_eSAFE, we focus on practical knowledge,
              industry perspectives, and mentorship that helps
              you develop skills for your future career.
            </p>

            <div className="mentors-hero-actions">
              <Link
                to="/#tracks"
                className="mentors-btn mentors-btn-primary"
              >
                Explore Programs
                <ArrowRight size={18} />
              </Link>

              <a
                href="#mentor-approach"
                className="mentors-btn mentors-btn-secondary"
              >
                Our Approach
              </a>
            </div>

            <div className="mentors-trust-points">
              <span>
                <CheckCircle2 size={17} />
                Practical learning
              </span>

              <span>
                <CheckCircle2 size={17} />
                Career-focused guidance
              </span>
            </div>
          </div>

          {/* Illustration and labels are contained together to prevent overlap */}
          <div className="mentors-hero-visual">
            <div className="mentors-visual-glow" />

            <div className="mentors-feature-card">
              <div className="mentors-illustration">
                <div className="mentors-illustration-ring" />

                <div className="mentors-illustration-person">
                  <GraduationCap size={66} strokeWidth={1.5} />
                </div>

                <span className="mentors-float-icon mentors-float-icon-one">
                  <Lightbulb size={21} />
                </span>

                <span className="mentors-float-icon mentors-float-icon-two">
                  <Target size={21} />
                </span>

                <span className="mentors-float-icon mentors-float-icon-three">
                  <BookOpen size={21} />
                </span>
              </div>

              <div className="mentors-visual-caption">
                <span className="mentors-status-dot" />

                <div>
                  <strong>Guidance that matters</strong>
                  <p>From learning to career readiness</p>
                </div>
              </div>
            </div>

            <div className="mentors-floating-note mentors-floating-note-top">
              <span className="mentors-note-icon">
                <BriefcaseBusiness size={19} />
              </span>

              <span>
                <strong>Industry perspective</strong>
                <small>Learn beyond textbooks</small>
              </span>
            </div>

            <div className="mentors-floating-note mentors-floating-note-bottom">
              <span className="mentors-note-icon">
                <Rocket size={19} />
              </span>

              <span>
                <strong>Career-focused</strong>
                <small>Build skills with purpose</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* WHO WILL GUIDE YOU */}
      <section className="who-guides-section">
        <div className="mentors-container">
          <div className="who-guides-heading">
            <span className="mentors-eyebrow">
              <Users size={16} />
              MEET YOUR LEARNING PARTNERS
            </span>

            <h2>
              Who will guide you?
              <span>
                Learn from people who understand the industry.
              </span>
            </h2>

            <p>
              Great learning combines strong fundamentals,
              practical experience, and the right guidance.
              Our mentorship approach helps connect what you
              learn with what the industry expects.
            </p>
          </div>

          <div className="who-guides-grid">
            {mentorProfiles.map((mentor) => {
              const Icon = mentor.icon;

              return (
                <article
                  className="who-guides-card"
                  key={mentor.number}
                >
                  <div className="who-guides-card-top">
                    <div className="who-guides-icon">
                      <Icon size={26} />
                    </div>

                    <span className="who-guides-number">
                      {mentor.number}
                    </span>
                  </div>

                  <h3>{mentor.title}</h3>
                  <p>{mentor.description}</p>

                  <span className="who-guides-tag">
                    <CheckCircle2 size={14} />
                    {mentor.tag}
                  </span>
                </article>
              );
            })}
          </div>

          <div className="who-guides-note">
            <span className="who-guides-note-icon">
              <Lightbulb size={23} />
            </span>

            <p>
              <strong>Our philosophy:</strong> Don't just learn
              a technology. Understand how to use it, solve
              problems with it, and keep growing.
            </p>
          </div>
        </div>
      </section>

      {/* MENTORSHIP BENEFITS */}
      <section className="mentors-intro" id="mentor-approach">
        <div className="mentors-container">
          <div className="mentors-section-heading">
            <span className="mentors-eyebrow">
              THE AV_eSAFE APPROACH
            </span>

            <h2>
              More than teaching.
              <span>A path to growth.</span>
            </h2>

            <p>
              We want you to understand what you learn, apply
              it confidently, and develop the skills needed
              to take the next step in your career.
              Select a card to explore more.
            </p>
          </div>

          <div className="mentors-benefits-grid">
            {mentorBenefits.map((benefit, index) => {
              const Icon = benefit.icon;

              return (
                <button
                  type="button"
                  className="mentors-benefit-card"
                  key={benefit.title}
                  style={{ "--card-index": index }}
                  onClick={() => setActiveBenefit(benefit)}
                  aria-haspopup="dialog"
                  aria-label={`Learn more about ${benefit.title}`}
                >
                  <span className="mentors-benefit-card-top">
                    <span className="mentors-benefit-icon">
                      <Icon size={25} strokeWidth={1.8} />
                    </span>

                    <span className="mentors-benefit-open">
                      <ArrowRight size={18} />
                    </span>
                  </span>

                  <span className="mentors-benefit-title">
                    {benefit.title}
                  </span>

                  <span className="mentors-benefit-description">
                    {benefit.description}
                  </span>

                  <span className="mentors-card-arrow">
                    Learn more <ArrowRight size={17} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* LEARNING JOURNEY */}
      <section className="mentors-expect">
        <div className="mentors-container mentors-expect-grid">
          <div className="mentors-expect-copy">
            <span className="mentors-eyebrow">
              YOUR LEARNING JOURNEY
            </span>

            <h2>
              Learn. Practise.
              <span>Improve. Succeed.</span>
            </h2>

            <p>
              Learning becomes more meaningful when you can
              connect concepts with practical applications.
              Our approach focuses on helping you build
              understanding, improve through practice, and
              prepare for professional opportunities.
            </p>

            <Link
              to="/#tracks"
              className="mentors-text-link"
            >
              Find your learning path
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="mentors-principles-card">
            <div className="mentors-principles-heading">
              <span className="mentors-principles-icon">
                <GraduationCap size={27} />
              </span>

              <div>
                <h3>What you can expect</h3>
                <p>A supportive, practical learning experience</p>
              </div>
            </div>

            <ul>
              {mentorPrinciples.map((principle) => (
                <li key={principle}>
                  <CheckCircle2 size={19} />
                  <span>{principle}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="mentors-cta-section">
        <div className="mentors-container">
          <div className="mentors-cta-card">
            <div className="mentors-cta-decoration" />

            <span className="mentors-eyebrow">
              YOUR NEXT CHAPTER STARTS HERE
            </span>

            <h2>
              Ready to turn your skills
              <span>into opportunities?</span>
            </h2>

            <p>
              Explore our training programs and take the next
              step towards becoming career-ready.
            </p>

            <Link
              to="/#apply"
              className="mentors-btn mentors-btn-light"
            >
              Start Your Journey
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* BENEFIT DETAILS POPUP */}
      {activeBenefit && (
        <div
          className="mentor-modal-backdrop"
          onClick={closeModal}
        >
          <section
            className="mentor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mentor-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="mentor-modal-close"
              onClick={closeModal}
              aria-label="Close popup"
              autoFocus
            >
              <X size={21} />
            </button>

            <div className="mentor-modal-icon">
              {(() => {
                const Icon = activeBenefit.icon;
                return <Icon size={30} />;
              })()}
            </div>

            <span className="mentors-eyebrow">
              THE AV_eSAFE APPROACH
            </span>

            <h2 id="mentor-modal-title">
              {activeBenefit.title}
            </h2>

            <p className="mentor-modal-description">
              {activeBenefit.details}
            </p>

            <div className="mentor-modal-points">
              <h3>What this means for you</h3>

              {activeBenefit.points.map((point) => (
                <div className="mentor-modal-point" key={point}>
                  <CheckCircle2 size={19} />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mentors-btn mentors-btn-primary mentor-modal-done"
              onClick={closeModal}
            >
              Got it <ArrowRight size={17} />
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
