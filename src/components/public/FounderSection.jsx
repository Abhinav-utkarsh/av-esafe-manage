import { useEffect, useRef } from "react";
import {
    ArrowUpRight,
    GraduationCap,
    Lightbulb,
    Target,
    Sparkles,
} from "lucide-react";

import "./FounderSection.css";

export default function FounderSection() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const section = sectionRef.current;

        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("founder-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.15,
            }
        );

        section
            .querySelectorAll(".founder-reveal")
            .forEach((element) => observer.observe(element));

        return () => observer.disconnect();
    }, []);

    return (
        <section
            className="founder-section"
            id="founder"
            ref={sectionRef}
        >
            <div className="founder-container">

                {/* Section Header */}
                <div className="founder-header founder-reveal">
                    <span className="founder-eyebrow">
                        <Sparkles size={15} />
                        THE PERSON BEHIND AV_eSAFE
                    </span>

                    <h2>
                        Meet the <span>Founder</span>
                    </h2>

                    <p>
                        A vision to make practical IT education accessible,
                        meaningful, and career-focused.
                    </p>
                </div>

                {/* Founder Content */}
                <div className="founder-content">

                    {/* Founder Image */}
                    <div className="founder-image-wrapper founder-reveal">
                        <div className="founder-image-glow"></div>

                        <div className="founder-image-card">
                            <img
                                src="/founder.jpg"
                                alt="Abhinav Utkarsh - Founder of Av_eSAFE"
                                className="founder-image"
                            />

                            <div className="founder-image-overlay">
                                <div className="founder-image-caption">
                                    <span className="founder-caption-label">
                                        FOUNDER & VISIONARY
                                    </span>

                                    <h3>Abhinav Utkarsh</h3>

                                    <p>Founder of Av_eSAFE</p>
                                </div>
                            </div>
                        </div>

                        <div className="founder-floating-badge">
                            <GraduationCap size={22} />

                            <div>
                                <strong>Learn. Build. Grow.</strong>
                                <span>Career-focused learning</span>
                            </div>
                        </div>
                    </div>

                    {/* Founder Information */}
                    <div className="founder-info founder-reveal">

                        <span className="founder-info-tag">
                            HELLO, I'M ABHINAV
                        </span>

                        <h3>
                            Building a bridge between
                            <span> learning and opportunity.</span>
                        </h3>

                        <p className="founder-description">
                            Av_eSAFE was founded with a simple belief:
                            every aspiring student deserves an opportunity
                            to learn practical skills and prepare for the
                            professional world.
                        </p>

                        <p className="founder-description">
                            Through Av_eSAFE Training, my goal is to help
                            learners strengthen their technical foundations,
                            develop confidence, and take meaningful steps
                            toward their careers in IT.
                        </p>

                        {/* Vision & Mission */}
                        <div className="founder-values">

                            <div className="founder-value-card">
                                <div className="founder-value-icon">
                                    <Lightbulb size={21} />
                                </div>

                                <div>
                                    <h4>Our Vision</h4>

                                    <p>
                                        Empower learners with accessible,
                                        practical, and industry-oriented education.
                                    </p>
                                </div>
                            </div>

                            <div className="founder-value-card">
                                <div className="founder-value-icon">
                                    <Target size={21} />
                                </div>

                                <div>
                                    <h4>Our Mission</h4>

                                    <p>
                                        Transform learning into real-world skills
                                        through structured training and guidance.
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* CTA */}
                        <a
                            href="#apply"
                            className="founder-cta"
                        >
                            Start Your Learning Journey

                            <ArrowUpRight size={18} />
                        </a>

                    </div>
                </div>

            </div>
        </section>
    );
}
