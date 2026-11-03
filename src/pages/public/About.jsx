
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Lightbulb,
  MessageCircle,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  BriefcaseBusiness,
} from "lucide-react";

import Navbar from "../../components/public/Navbar";
import "./About.css";

const visionPoints = [
  {
    title: "Bridge the Gap",
    description:
      "Connect academic learning with real-world industry expectations.",
  },
  {
    title: "Build Practical Skills",
    description:
      "Help learners apply their knowledge through hands-on projects and practical experience.",
  },
  {
    title: "Strengthen Confidence",
    description:
      "Prepare students to approach interviews, challenges, and opportunities with confidence.",
  },
  {
    title: "Enable Career Readiness",
    description:
      "Develop the capabilities learners need to pursue meaningful career opportunities.",
  },
  {
    title: "Promote Equal Opportunities",
    description:
      "Make structured skill development and placement preparation accessible to aspiring learners.",
  },
  {
    title: "Inspire Lifelong Learning",
    description:
      "Encourage curiosity, continuous improvement, and a lasting commitment to learning.",
  },
];

const benefits = [
  {
    icon: GraduationCap,
    title: "Learn from Industry-Experienced Experts",
    description:
      "Learn from domain specialists with 10+ years of industry experience who bring practical insights and professional perspectives into learning sessions.",
    number: "01",
  },
  {
    icon: Users,
    title: "Every Student Matters",
    description:
      "Get individual attention, clarify doubts, address learning gaps, and progress at a pace that supports your understanding.",
    number: "02",
  },
  {
    icon: MessageCircle,
    title: "Interactive, Not One-Way Learning",
    description:
      "Dedicated Q&A sessions encourage students to ask questions, exchange ideas, and understand concepts more deeply.",
    number: "03",
  },
  {
    icon: ClipboardCheck,
    title: "Practise Before the Real Challenge",
    description:
      "Use aptitude assessments and mock interviews to evaluate your preparation, identify gaps, and improve through practice.",
    number: "04",
  },
  {
    icon: TrendingUp,
    title: "Your Feedback Shapes Our Learning",
    description:
      "Subject-wise feedback helps us recognise improvement areas and continuously refine the learning experience.",
    number: "05",
  },
  {
    icon: Award,
    title: "Achievement That Gets Recognised",
    description:
      "Earn a Certificate of Completion after completing the programme. The top 10 rankers also receive a Certificate of Appreciation signed by the Founder.",
    number: "06",
  },
  {
    icon: ShieldCheck,
    title: "A Registered Business",
    description:
      "AV_eSAFE is registered under India's MSME framework, providing an additional point of business transparency.",
    number: "07",
  },
];

const journey = [
  {
    icon: BookOpen,
    step: "01",
    title: "Learn",
    description:
      "Build your foundation with guidance from experienced domain specialists.",
  },
  {
    icon: MessageCircle,
    step: "02",
    title: "Ask & Understand",
    description:
      "Participate in Q&A sessions and doubt-clearing discussions. Keep learning without letting questions hold you back.",
  },
  {
    icon: Lightbulb,
    step: "03",
    title: "Practise & Build",
    description:
      "Apply your knowledge through practical exercises, coding projects, and aptitude assessments.",
  },
  {
    icon: Target,
    step: "04",
    title: "Prepare",
    description:
      "Experience mock interviews, identify improvement areas, and strengthen your approach to career opportunities.",
  },
  {
    icon: Award,
    step: "05",
    title: "Grow & Get Recognised",
    description:
      "Complete your learning journey, share feedback, and earn recognition based on your achievement.",
  },
];

export default function About() {
  return (
    <div className="about-page">
      <Navbar />

      <main>
        {/* About Hero */}
        <section className="about-hero">
          <div className="about-hero-glow about-hero-glow-one" />
          <div className="about-hero-glow about-hero-glow-two" />

          <div className="about-container">
            <div className="about-eyebrow">
              <span />
              ABOUT AV_eSAFE TRAINING
            </div>

            <h1 className="about-hero-title">
              From classroom learning
              <span> to career readiness.</span>
            </h1>

            <p className="about-hero-description">
              At AV_eSAFE, we turn classroom knowledge into real-world skills
              through hands-on projects and purposeful practice. We help
              students build confidence, strengthen practical abilities, and
              take their next career step with greater readiness.
            </p>

            <div className="about-hero-actions">
              <Link to="/#tracks" className="about-button about-button-primary">
                Explore Our Programmes
                <ArrowRight size={18} />
              </Link>

              <a href="#our-mission" className="about-button about-button-secondary">
                Discover Our Purpose
              </a>
            </div>

            <div className="about-tagline">
              <span className="about-tagline-line" />
              <p>
                Learn with Purpose. Build with Proof.
                <strong> Step Forward with Confidence.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Mission and Vision */}
        <section className="about-purpose" id="our-mission">
          <div className="about-container">
            <div className="about-section-heading">
              <span className="about-section-label">OUR PURPOSE</span>
              <h2>
                Learning should lead to
                <span> real opportunities.</span>
              </h2>
              <p>
                We believe that understanding a concept is just the beginning.
                Applying it, learning from mistakes, and building confidence
                are what help students move forward.
              </p>
            </div>

            <div className="about-purpose-grid">
              <article className="about-purpose-card about-mission-card">
                <div className="about-card-icon">
                  <Target size={27} />
                </div>

                <span className="about-card-eyebrow">OUR MISSION</span>

                <h3>Turn knowledge into capability.</h3>

                <p>
                  At AV_eSAFE, we turn classroom knowledge into real-world
                  skills through hands-on projects and purposeful practice.
                  We empower students to build confidence, become
                  placement-ready, and step into their future prepared to
                  succeed.
                </p>

                <div className="about-card-decoration">
                  <Target size={105} strokeWidth={0.7} />
                </div>
              </article>

              <article className="about-purpose-card about-vision-card">
                <div className="about-card-icon">
                  <Lightbulb size={27} />
                </div>

                <span className="about-card-eyebrow">OUR VISION</span>

                <h3>A more confident, career-ready generation.</h3>

                <div className="about-vision-list">
                  {visionPoints.map((item) => (
                    <div className="about-vision-item" key={item.title}>
                      <CheckCircle2 size={18} />
                      <div>
                        <h4>{item.title}</h4>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Learning Journey */}
        <section className="about-journey" id="learning-journey">
          <div className="about-container">
            <div className="about-section-heading">
              <span className="about-section-label">THE LEARNING JOURNEY</span>
              <h2>
                Learn it. Practise it.
                <span> Build your future.</span>
              </h2>
              <p>
                A structured journey that takes students from understanding
                concepts to practising skills and preparing for career
                opportunities.
              </p>
            </div>

            <div className="about-journey-flow">
              {journey.map((item, index) => {
                const Icon = item.icon;

                return (
                  <article className="about-journey-card" key={item.step}>
                    <div className="about-journey-top">
                      <span className="about-journey-number">{item.step}</span>
                      <div className="about-journey-icon">
                        <Icon size={25} />
                      </div>
                    </div>

                    <h3>{item.title}</h3>
                    <p>{item.description}</p>

                    {index < journey.length - 1 && (
                      <ArrowRight
                        className="about-journey-arrow"
                        size={20}
                        aria-hidden="true"
                      />
                    )}
                  </article>
                );
              })}
            </div>

            <div className="about-journey-summary">
              <span className="about-summary-dot" />
              Learn with purpose. Practise with intention. Progress with
              confidence.
            </div>
          </div>
        </section>

        {/* Why AV_eSAFE */}
        <section className="about-benefits" id="why-avesafe">
          <div className="about-container">
            <div className="about-section-heading">
              <span className="about-section-label">WHY AV_eSAFE?</span>
              <h2>
                More than learning.
                <span> A path to progress.</span>
              </h2>
              <p>
                Every part of the experience is designed to help learners
                understand better, practise more, and prepare with purpose.
              </p>
            </div>

            <div className="about-benefits-grid">
              {benefits.map((item) => {
                const Icon = item.icon;

                return (
                  <article className="about-benefit-card" key={item.number}>
                    <div className="about-benefit-top">
                      <div className="about-benefit-icon">
                        <Icon size={25} />
                      </div>
                      <span className="about-benefit-number">
                        {item.number}
                      </span>
                    </div>

                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Founder */}
        <section className="about-founder" id="founder">
          <div className="about-container">
            <div className="about-founder-card">
              <div className="about-founder-photo-wrap">
                <img
                  src="/founder.jpg"
                  alt="Abhinav Utkarsh, Founder of AV_eSAFE"
                  className="about-founder-photo"
                  loading="lazy"
                />

                <div className="about-founder-photo-label">
                  <span />
                  The person behind AV_eSAFE
                </div>
              </div>

              <div className="about-founder-content">
                <span className="about-section-label">MEET THE FOUNDER</span>

                <h2>
                  Abhinav Utkarsh
                  <span>Founder & Software Engineer</span>
                </h2>

                <p>
                  AV_eSAFE was founded with a simple belief: students deserve
                  opportunities to turn what they learn into what they can
                  actually build. The initiative brings together technology,
                  practical learning, and career preparation to help learners
                  take meaningful steps towards their goals.
                </p>

                <p>
                  Through AV_eSAFE Training, the aim is to make learning more
                  engaging and practical with structured programmes, hands-on
                  activities, assessments, and project-based experiences.
                </p>

                <div className="about-founder-tags">
                  <span>Software Engineering</span>
                  <span>Education & IT Services</span>
                  <span>AI & Automation</span>
                </div>

                <Link
                  to="/founder"
                  className="about-text-link"
                >
                  Get to know the founder
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Registration and Credibility */}
        <section className="about-credibility">
          <div className="about-container">
            <div className="about-credibility-inner">
              <div className="about-credibility-icon">
                <BriefcaseBusiness size={28} />
              </div>

              <div className="about-credibility-content">
                <span className="about-section-label">
                  BUSINESS CREDIBILITY
                </span>
                <h2>Built with purpose. Registered as a business.</h2>
                <p>
                  AV_eSAFE is registered under India's MSME framework. This
                  provides an additional point of business transparency.
                  MSME registration is a business registration detail, not an
                  accreditation or endorsement of educational quality.
                </p>
              </div>

              <div className="about-msme-mark">
                <ShieldCheck size={23} />
                <span>MSME Registered</span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="about-final-cta">
          <div className="about-cta-orb about-cta-orb-one" />
          <div className="about-cta-orb about-cta-orb-two" />

          <div className="about-container about-final-cta-content">
            <span className="about-section-label">YOUR NEXT CHAPTER</span>

            <h2>
              Your potential deserves
              <span> the right guidance.</span>
            </h2>

            <p>
              Learn from experienced professionals. Get your doubts answered.
              Practise with purpose. Build the confidence to take your next
              career step.
            </p>

            <div className="about-cta-tagline">
              Don't just prepare. Progress.
            </div>

            <Link to="/#tracks" className="about-button about-button-primary">
              Start Your Journey
              <ArrowRight size={18} />
            </Link>

            <p className="about-cta-footnote">
              Your journey to career readiness starts with AV_eSAFE.
            </p>
          </div>
        </section>
      </main>

      <footer className="about-footer">
        <p>
          © {new Date().getFullYear()} AV_eSAFE Training. All rights reserved.
        </p>
        <a href="#top" onClick={(event) => {
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}>
          Back to top ↑
        </a>
      </footer>
    </div>
  );
}
