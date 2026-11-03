
import { useEffect, useRef } from "react";
import {
  BookOpen,
  ClipboardList,
  CreditCard,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import "./HowItWorks.css";

const steps = [
  {
    number: "01",
    title: "Choose Your Program",
    description:
      "Explore our training tracks and select the program that aligns with your career goals and interests.",
    icon: BookOpen,
    tag: "Explore Programs",
  },
  {
    number: "02",
    title: "Submit Your Application",
    description:
      "Fill out our application form with your details, educational background, and learning objectives.",
    icon: ClipboardList,
    tag: "Apply Online",
  },
  {
    number: "03",
    title: "Complete Your Payment",
    description:
      "Follow the payment instructions provided and complete your program fee payment.",
    icon: CreditCard,
    tag: "Secure Payment",
  },
  {
    number: "04",
    title: "Get Enrolled",
    description:
      "Once your application and payment are verified by our admin team, receive your Academy access and begin learning.",
    icon: GraduationCap,
    tag: "Start Learning",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("how-it-works-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
      }
    );

    const elements = section.querySelectorAll(
      ".how-it-works-heading, .how-it-works-card"
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="how-it-works-section"
      id="process"
      ref={sectionRef}
    >
      <div className="how-it-works-container">

        {/* Section Heading */}

        <div className="how-it-works-heading">
          <span className="how-it-works-eyebrow">
            YOUR LEARNING JOURNEY
          </span>

          <h2>
            How It <span>Works</span>
          </h2>

          <p>
            Your journey toward a successful IT career starts here.
            Follow these simple steps to become part of Av_eSAFE.
          </p>
        </div>

        {/* Process Steps */}

        <div className="how-it-works-grid">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                className="how-it-works-card"
                key={step.number}
                style={{
                  "--card-index": index,
                }}
              >
                <div className="how-it-works-card-top">

                  <span className="how-it-works-number">
                    {step.number}
                  </span>

                  <div className="how-it-works-icon">
                    <Icon size={25} strokeWidth={1.8} />
                  </div>

                </div>

                <div className="how-it-works-card-content">

                  <span className="how-it-works-tag">
                    {step.tag}
                  </span>

                  <h3>{step.title}</h3>

                  <p>{step.description}</p>

                </div>

                <div className="how-it-works-card-bottom">

                  <div className="how-it-works-step-status">
                    <CheckCircle2 size={16} />
                    <span>Step {index + 1}</span>
                  </div>

                  {index !== steps.length - 1 && (
                    <ArrowRight
                      className="how-it-works-arrow"
                      size={19}
                    />
                  )}

                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}

        <div className="how-it-works-bottom">
          <div className="how-it-works-bottom-content">

            <div className="how-it-works-bottom-icon">
              <GraduationCap size={30} />
            </div>

            <div>
              <h3>Ready to begin your journey?</h3>
              <p>
                Take the first step toward building your future
                with Av_eSAFE.
              </p>
            </div>

          </div>

          <a
            href="#apply"
            className="how-it-works-cta"
          >
            Apply Now
            <ArrowRight size={18} />
          </a>
        </div>

      </div>
    </section>
  );
}
