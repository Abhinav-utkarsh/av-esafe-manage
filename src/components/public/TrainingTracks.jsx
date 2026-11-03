
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Code2,
  Coffee,
  BrainCircuit,
  TestTube2,
  Database,
  Bot,
  BarChart3,
  Cloud,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  X,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

import "./TrainingTracks.css";

const trainingTracks = [
  {
    id: "web-development",
    number: "01",
    title: "Web Development",
    description:
      "Build responsive, modern websites and interactive web applications from the ground up.",
    skills: ["HTML & CSS", "JavaScript", "React.js"],
    icon: Code2,
    category: "Development",
    overview:
      "Learn how to turn ideas into responsive websites and interactive web experiences. Build your foundations step by step and apply them in practical exercises and projects.",
    topics: [
      "HTML page structure and semantic markup",
      "CSS layouts, Flexbox, Grid, and responsive design",
      "JavaScript fundamentals and DOM interactions",
      "React components and reusable UI patterns",
      "Building and presenting a portfolio-ready project",
    ],
    outcomes: [
      "Create responsive pages for desktop and mobile",
      "Add interactivity using JavaScript",
      "Understand component-based development with React",
    ],
  },
  {
    id: "java",
    number: "02",
    title: "Java Programming",
    description:
      "Strengthen programming fundamentals and learn to develop structured, maintainable applications.",
    skills: ["Core Java", "OOP Concepts", "Collections"],
    icon: Coffee,
    category: "Programming",
    overview:
      "Build a strong programming foundation with Java, from core syntax to object-oriented design and commonly used data structures.",
    topics: [
      "Variables, data types, operators, and control flow",
      "Classes, objects, inheritance, and polymorphism",
      "Exception handling and debugging basics",
      "Collections and working with data",
      "Writing small console-based applications",
    ],
    outcomes: [
      "Write structured Java programs",
      "Apply object-oriented programming principles",
      "Work with collections and handle common errors",
    ],
  },
  {
    id: "python",
    number: "03",
    title: "Python Programming",
    description:
      "Learn Python through practical coding exercises, automation tasks, and application development.",
    skills: ["Python Basics", "OOP", "Automation"],
    icon: Bot,
    category: "Programming",
    overview:
      "Explore Python with beginner-friendly exercises and practical examples. Develop confidence in writing readable code and automating repetitive tasks.",
    topics: [
      "Python syntax, variables, and data types",
      "Conditions, loops, functions, and modules",
      "Lists, dictionaries, sets, and tuples",
      "Files, exceptions, and object-oriented basics",
      "Small scripts and introductory automation tasks",
    ],
    outcomes: [
      "Write readable Python programs",
      "Organize code with functions and modules",
      "Build simple scripts to solve practical problems",
    ],
  },
  {
    id: "software-testing",
    number: "04",
    title: "Software Testing",
    description:
      "Understand software quality and practice designing and executing meaningful test scenarios.",
    skills: ["Manual Testing", "Selenium", "TestNG"],
    icon: TestTube2,
    category: "Quality Engineering",
    overview:
      "Learn how quality engineering helps teams deliver reliable software. Practice testing fundamentals and get introduced to web test automation concepts.",
    topics: [
      "SDLC, STLC, and software testing fundamentals",
      "Test scenarios, test cases, and test data",
      "Defect reporting and severity versus priority",
      "Selenium WebDriver fundamentals",
      "TestNG basics and organizing automation tests",
    ],
    outcomes: [
      "Write clear test scenarios and test cases",
      "Understand defect life cycle and reporting",
      "Build introductory automated web tests",
    ],
  },
  {
    id: "sql",
    number: "05",
    title: "SQL & Databases",
    description:
      "Work with relational databases and learn to retrieve, analyze, and manage structured data.",
    skills: ["SQL Queries", "Joins", "Database Design"],
    icon: Database,
    category: "Data",
    overview:
      "Learn to query relational databases, connect information across tables, and use SQL to answer practical data questions.",
    topics: [
      "Tables, records, data types, and keys",
      "SELECT, filtering, sorting, and aggregate functions",
      "INNER, LEFT, RIGHT, and other common joins",
      "Subqueries and grouping data",
      "Basic data modelling and database design concepts",
    ],
    outcomes: [
      "Write SQL queries to retrieve relevant information",
      "Combine data from multiple tables using joins",
      "Summarize datasets using aggregates and grouping",
    ],
  },
  {
    id: "ai-generative-ai",
    number: "06",
    title: "AI & Generative AI",
    description:
      "Explore AI concepts and build practical applications using prompts, LLMs, and AI-powered workflows.",
    skills: ["Prompt Engineering", "LLMs", "AI Applications"],
    icon: BrainCircuit,
    category: "Emerging Technology",
    featured: true,
    overview:
      "Get familiar with modern AI and generative AI concepts, learn how to communicate with large language models, and explore practical AI-powered workflows.",
    topics: [
      "AI, machine learning, generative AI, and LLM fundamentals",
      "Prompt structure, instructions, and examples",
      "Zero-shot, one-shot, and few-shot prompting",
      "Hallucinations, responsible use, and prompt injection awareness",
      "Introduction to embeddings and retrieval-augmented generation (RAG)",
      "Designing a small AI-assisted workflow or prototype",
    ],
    outcomes: [
      "Write clearer prompts for common tasks",
      "Explain basic LLM and RAG concepts",
      "Identify common limitations and safety considerations of AI tools",
    ],
  },
  {
    id: "data-analytics",
    number: "07",
    title: "Data Analytics",
    description:
      "Turn data into useful insights by learning data preparation, analysis, and visualization fundamentals.",
    skills: ["Excel", "SQL", "Data Visualization"],
    icon: BarChart3,
    category: "Data",
    overview:
      "Discover how to clean, explore, and summarize data to communicate useful findings. Focus on practical analysis and clear visual presentation.",
    topics: [
      "Understanding datasets and data quality",
      "Spreadsheet formulas, sorting, filtering, and summaries",
      "SQL basics for retrieving data",
      "Charts and visualization principles",
      "Turning observations into a concise report or dashboard",
    ],
    outcomes: [
      "Prepare and summarize basic datasets",
      "Choose suitable charts for different questions",
      "Communicate findings with clear visuals and explanations",
    ],
  },
  {
    id: "cloud-computing",
    number: "08",
    title: "Cloud Computing",
    description:
      "Understand cloud fundamentals, deployment concepts, and the services behind modern applications.",
    skills: ["Cloud Fundamentals", "Deployment", "Cloud Services"],
    icon: Cloud,
    category: "Infrastructure",
    overview:
      "Understand the building blocks of cloud computing and how applications use cloud services for hosting, storage, and deployment.",
    topics: [
      "Cloud computing concepts and service models",
      "Public, private, and hybrid cloud deployment models",
      "Compute, storage, networking, and identity basics",
      "Application hosting and deployment concepts",
      "Security, cost awareness, and reliability fundamentals",
    ],
    outcomes: [
      "Explain common cloud service and deployment models",
      "Recognize core cloud infrastructure components",
      "Understand the steps involved in deploying an application",
    ],
  },
];

function TrainingTracks() {
  const [selectedTrack, setSelectedTrack] = useState(null);

  const closeModal = () => setSelectedTrack(null);

  useEffect(() => {
    if (!selectedTrack) return undefined;

    const previousOverflow = document.body.style.overflow;

    document.body.classList.add("training-modal-open");
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedTrack(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("training-modal-open");
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedTrack]);

  const handleApplyNow = () => {
    setSelectedTrack(null);

    window.setTimeout(() => {
      const applicationSection = document.getElementById("apply");

      if (applicationSection) {
        applicationSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 250);
  };

  return (
    <>
      <section
        className="training-tracks section-padding"
        id="tracks"
        aria-labelledby="training-tracks-title"
      >
        <div className="training-tracks__container">
          <div className="training-tracks__heading">
            <div className="training-tracks__eyebrow">
              <span className="training-tracks__eyebrow-dot" />
              LEARN WITH PURPOSE
            </div>

            <div className="training-tracks__heading-row">
              <div>
                <h2 id="training-tracks-title">
                  Choose your path.
                  <span>Build your future.</span>
                </h2>

                <p className="training-tracks__intro">
                  Explore practical learning tracks designed to strengthen your
                  technical foundations, help you build real-world projects,
                  and prepare for your next career opportunity.
                </p>
              </div>

              <div className="training-tracks__count">
                <Sparkles size={17} aria-hidden="true" />
                <span>08 learning tracks</span>
              </div>
            </div>
          </div>

          <div className="training-tracks__grid">
            {trainingTracks.map((track) => {
              const Icon = track.icon;

              return (
                <article
                  className={`training-card ${
                    track.featured ? "training-card--featured" : ""
                  }`}
                  key={track.id}
                  role="button"
                  tabIndex={0}
                  aria-haspopup="dialog"
                  aria-label={`Explore ${track.title} track`}
                  onClick={() => setSelectedTrack(track)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;

                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedTrack(track);
                    }
                  }}
                >
                  <div className="training-card__top">
                    <div className="training-card__icon">
                      <Icon size={23} strokeWidth={1.8} aria-hidden="true" />
                    </div>

                    <span className="training-card__number">
                      {track.number}
                    </span>
                  </div>

                  <div className="training-card__content">
                    <span className="training-card__category">
                      {track.category}
                    </span>

                    <h3>{track.title}</h3>

                    <p>{track.description}</p>
                  </div>

                  <div className="training-card__skills">
                    {track.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>

                  <div className="training-card__explore" aria-hidden="true">
                    <span>Explore track</span>
                    <ArrowUpRight size={16} />
                  </div>
                </article>
              );
            })}
          </div>

          <div className="training-tracks__note">
            <div className="training-tracks__note-icon">
              <Sparkles size={20} aria-hidden="true" />
            </div>

            <p>
              <strong>Learn by building, not just watching.</strong>
              <span>
                Training activities and project work can be aligned with the
                selected track and the program structure.
              </span>
            </p>

            <a href="#apply" className="training-tracks__cta">
              Register your interest
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {selectedTrack &&
        createPortal(
          <div
            className="training-modal__backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >
            <section
              className="training-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="training-modal-title"
              aria-describedby="training-modal-overview"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="training-modal__top">
                <span className="training-modal__brand">
                  <Sparkles size={14} aria-hidden="true" />
                  AV_eSAFE LEARNING TRACKS
                </span>

                <button
                  type="button"
                  className="training-modal__close"
                  aria-label="Close course details"
                  onClick={closeModal}
                  autoFocus
                >
                  <X size={20} />
                </button>
              </div>

              <div className="training-modal__header">
                <div className="training-modal__icon">
                  {(() => {
                    const SelectedIcon = selectedTrack.icon;
                    return (
                      <SelectedIcon
                        size={29}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    );
                  })()}
                </div>

                <span className="training-modal__category">
                  TRACK {selectedTrack.number} · {selectedTrack.category}
                </span>

                <h2 id="training-modal-title">{selectedTrack.title}</h2>

                <p id="training-modal-overview">{selectedTrack.overview}</p>
              </div>

              <div className="training-modal__body">
                <div className="training-modal__section">
                  <h3>
                    <BookOpen size={18} aria-hidden="true" />
                    What you’ll explore
                  </h3>

                  <ul className="training-modal__topics">
                    {selectedTrack.topics.map((topic) => (
                      <li key={topic}>
                        <CheckCircle2 size={18} aria-hidden="true" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="training-modal__section">
                  <h3>
                    <Sparkles size={18} aria-hidden="true" />
                    Skills you’ll build
                  </h3>

                  <div className="training-modal__skills">
                    {selectedTrack.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>

                  <ul className="training-modal__outcomes">
                    {selectedTrack.outcomes.map((outcome) => (
                      <li key={outcome}>{outcome}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="training-modal__footer">
                <p>Interested in learning this track?</p>

                <button
                  type="button"
                  className="training-modal__apply"
                  onClick={handleApplyNow}
                >
                  Apply Now
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
            </section>
          </div>,
          document.body
        )}
    </>
  );
}

export default TrainingTracks;
