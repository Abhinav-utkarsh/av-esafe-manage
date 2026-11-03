import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  MessageCircle,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

import "./FAQ.css";

export default function FAQ() {
  const sectionRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const faqs = [
    {
      question: "What is Av_eSAFE Training?",
      answer:
        "Av_eSAFE Training is a learning initiative designed to help aspiring IT professionals develop practical technical skills and prepare for career opportunities through structured training programs.",
    },
    {
      question: "What training programs are available?",
      answer:
        "We offer training programs in Web Development, Java, Python, Software Testing, SQL, AI & Generative AI, Data Analytics, and Cloud Computing. Additional sessions such as Aptitude, Resume Building, and Interview Preparation are also available.",
    },
    {
      question: "Who can apply for the training programs?",
      answer:
        "Students, recent graduates, and aspiring IT professionals who want to improve their technical knowledge and career readiness can apply.",
    },
    {
      question: "How can I apply for a training program?",
      answer:
        "Visit the application section of our website, complete the application form, select your interested training program, and submit your details. Our team will review your application.",
    },
    {
      question: "How does the payment verification process work?",
      answer:
        "After submitting your application, you can complete the payment using the provided payment instructions. The Av_eSAFE Admin team manually verifies the payment before enrollment.",
    },
    {
      question: "How will I receive my Academy login credentials?",
      answer:
        "Once your application and payment are verified, the Admin team will create your Academy account and provide your login access.",
    },
    {
      question: "Can I track my training progress?",
      answer:
        "Yes. After logging into Av_eSAFE Academy, you can view your enrolled courses and track your learning progress through your student dashboard.",
    },
    {
      question: "Will I receive a certificate after training?",
      answer:
        "Certificate eligibility and issuance depend on the applicable training program requirements. Please contact the Av_eSAFE team for details about your selected program.",
    },
    {
      question: "Can I enroll in multiple training programs?",
      answer:
        "Yes. You can apply for multiple programs or available bundles. Your Academy dashboard will display the courses included in your approved enrollment.",
    },
    {
      question: "How can I contact Av_eSAFE?",
      answer:
        "You can reach out to us using the contact details or application support information provided on our website. Our team will assist you with your queries.",
    },
  ];

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("faq-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
      }
    );

    section
      .querySelectorAll(".faq-reveal")
      .forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  const toggleFAQ = (index) => {
    setActiveIndex((currentIndex) =>
      currentIndex === index ? null : index
    );
  };

  return (
    <section
      className="faq-section"
      id="faq"
      ref={sectionRef}
    >
      <div className="faq-container">

        {/* Section Header */}
        <div className="faq-header faq-reveal">
          <span className="faq-eyebrow">
            <Sparkles size={15} />
            GOT QUESTIONS?
          </span>

          <h2>
            Frequently Asked
            <span> Questions</span>
          </h2>

          <p>
            Everything you need to know about Av_eSAFE Training,
            enrollment, and your learning journey.
          </p>
        </div>

        {/* FAQ Layout */}
        <div className="faq-content">

          {/* Left Information */}
          <div className="faq-sidebar faq-reveal">
            <div className="faq-sidebar-icon">
              <MessageCircle size={30} />
            </div>

            <span className="faq-sidebar-label">
              NEED MORE HELP?
            </span>

            <h3>
              Still have
              <span> questions?</span>
            </h3>

            <p>
              Couldn't find the answer you were looking for?
              Our team is here to help you understand your
              training options and enrollment process.
            </p>

            <a
              href="#apply"
              className="faq-contact-link"
            >
              Contact Our Team
              <ArrowUpRight size={18} />
            </a>

            <div className="faq-sidebar-decoration">
              <div className="faq-decoration-circle faq-circle-one"></div>
              <div className="faq-decoration-circle faq-circle-two"></div>
            </div>
          </div>

          {/* Accordion */}
          <div className="faq-list faq-reveal">
            {faqs.map((faq, index) => {
              const isActive = activeIndex === index;

              return (
                <div
                  className={`faq-item ${
                    isActive ? "faq-item-active" : ""
                  }`}
                  key={faq.question}
                >
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => toggleFAQ(index)}
                    aria-expanded={isActive}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span className="faq-question-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="faq-question-text">
                      {faq.question}
                    </span>

                    <span className="faq-chevron">
                      <ChevronDown size={19} />
                    </span>
                  </button>

                  <div
                    className="faq-answer-wrapper"
                    id={`faq-answer-${index}`}
                    aria-hidden={!isActive}
                  >
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
