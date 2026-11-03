import { Link } from "react-router-dom";
import {
  ArrowRight,
  GraduationCap,
  Lightbulb,
  Target,
  Code2,
  BrainCircuit,
  BookOpen,
} from "lucide-react";

import Navbar from "../../components/public/Navbar";
import "./Founder.css";

export default function Founder() {
  return (
    <div className="founder-page">
      <Navbar />

      <main>
        {/* Founder Hero Section */}
        <section className="founder-hero">
          <div className="founder-eyebrow">
            <span />
            THE PERSON BEHIND AV_eSAFE
          </div>

          <div className="founder-content">
            <div className="founder-photo-wrapper">
              <img
                src="/founder.jpg"
                alt="Abhinav Utkarsh, Founder of Av_eSAFE"
                className="founder-photo"
              />
              <div className="founder-photo-caption">
                <span className="founder-caption-dot" />
                Founder & Software Engineer
              </div>
            </div>

            <div className="founder-intro">
              <p className="founder-kicker">MEET THE FOUNDER</p>

              <h1>
                Building technology.
                <span> Empowering people.</span>
              </h1>

              <h2>Abhinav Utkarsh</h2>
              <p className="founder-designation">
                Founder of Av_eSAFE | Education & IT Services | Software Engineer
              </p>

              <p>
                Abhinav Utkarsh is the founder of Av_eSAFE, an initiative
                focused on making technology education more practical,
                accessible, and meaningful. With an interest in software
                engineering, emerging technologies, and digital learning,
                he aims to create solutions that help people learn,
                build, and grow with technology.
              </p>

              <p>
                Through Av_eSAFE Training, his vision is to bridge the gap
                between learning and industry expectations by bringing
                together structured courses, hands-on coding practice,
                assessments, and project-based learning.
              </p>

              <p>
                His approach is driven by continuous learning, innovation,
                and the belief that practical skills and the right guidance
                can help learners become more confident in their technology
                journey.
              </p>

              <Link to="/#tracks" className="founder-cta">
                Explore Our Programs
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* Expertise Section */}
        <section className="founder-expertise">
          <div className="founder-section-heading">
            <span>AREAS OF FOCUS</span>
            <h2>Where technology meets learning</h2>
            <p>
              Av_eSAFE brings together software, education, and innovation
              to make technology more accessible and practical.
            </p>
          </div>

          <div className="founder-expertise-grid">
            <article className="founder-expertise-card">
              <div className="founder-expertise-icon">
                <Code2 size={25} />
              </div>
              <h3>Software Engineering</h3>
              <p>
                Building digital solutions and exploring software
                development, testing, and technology-driven problem-solving.
              </p>
            </article>

            <article className="founder-expertise-card">
              <div className="founder-expertise-icon">
                <BookOpen size={25} />
              </div>
              <h3>Technology Education</h3>
              <p>
                Creating structured learning experiences that combine
                core concepts, coding exercises, assessments, and projects.
              </p>
            </article>

            <article className="founder-expertise-card">
              <div className="founder-expertise-icon">
                <BrainCircuit size={25} />
              </div>
              <h3>IT & Emerging Technologies</h3>
              <p>
                Exploring automation, AI-enabled solutions, and practical
                applications of modern technologies.
              </p>
            </article>
          </div>
        </section>

        {/* Mission Section */}
        <section className="founder-mission">
          <div className="founder-section-heading">
            <span>OUR PURPOSE</span>
            <h2>Learning that leads to real opportunities</h2>
            <p>
              We want to make technology education more engaging, practical,
              and relevant to the skills learners need to grow.
            </p>
          </div>

          <div className="founder-values">
            <article>
              <GraduationCap size={28} />
              <h3>Practical Learning</h3>
              <p>
                Learn core concepts through hands-on exercises, coding
                practice, and real-world projects instead of theory alone.
              </p>
            </article>

            <article>
              <Lightbulb size={28} />
              <h3>Innovation First</h3>
              <p>
                Explore modern technologies, experiment with ideas, and
                develop the problem-solving mindset needed in a changing
                technology landscape.
              </p>
            </article>

            <article>
              <Target size={28} />
              <h3>Career Readiness</h3>
              <p>
                Build confidence through structured learning, assessments,
                and practical skills that support your journey toward a
                technology career.
              </p>
            </article>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="founder-bottom">
          <h2>Your journey into technology starts here.</h2>
          <p>
            Explore our learning programs, strengthen your foundations, and
            take the next step toward becoming career-ready.
          </p>

          <Link to="/#tracks" className="founder-cta">
            Start Learning
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      <footer className="founder-footer">
        <p>
          © {new Date().getFullYear()} Av_eSAFE Training. All rights reserved.
        </p>
      </footer>
    </div>
  );
}