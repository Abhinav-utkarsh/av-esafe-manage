import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const isLoginPage = location.pathname === "/login";

  // ==========================================
  // NAVBAR SCROLL EFFECT
  // ==========================================

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ==========================================
  // CLOSE MOBILE MENU ON ROUTE CHANGE
  // ==========================================

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  // ==========================================
  // SCROLL TO TOP WHEN PAGE CHANGES
  // ==========================================

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [location.pathname]);

  // ==========================================
  // NAVIGATION LINKS
  // ==========================================

  const links = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Meet Our Founder", href: "/founder" },
    { label: "Our Mentor", href: "/our-mentors" },
  ];

  // ==========================================
  // GENERAL PAGE NAVIGATION
  // ==========================================

  const handlePageNavigation = (href) => {
    setMenuOpen(false);

    if (location.pathname === href) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
  };

  // ==========================================
  // SECTION NAVIGATION
  // HOW IT WORKS / FAQs
  // ==========================================

  const handleSectionNavigation = (sectionId) => {
    setMenuOpen(false);

    if (location.pathname !== "/") {
      navigate("/");

      setTimeout(() => {
        const section = document.getElementById(sectionId);

        if (section) {
          section.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 500);
    } else {
      const section = document.getElementById(sectionId);

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  // ==========================================
  // ACTIVE LINK CHECK
  // ==========================================

  const isActive = (href) => {
    if (href === "/") {
      return location.pathname === "/";
    }

    return location.pathname === href;
  };

  // ==========================================
  // APPLY NOW FORM NAVIGATION
  // ==========================================

  const handleApplyClick = () => {
    setMenuOpen(false);

    const scrollToApplicationForm = (attempt = 0) => {
      const applicationForm =
        document.getElementById("application-form");

      if (applicationForm) {
        applicationForm.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        return;
      }

      if (attempt < 20) {
        setTimeout(() => {
          scrollToApplicationForm(attempt + 1);
        }, 150);
      } else {
        console.warn(
          "Application form not found. Verify the application-form ID."
        );
      }
    };

    if (location.pathname !== "/") {
      navigate("/");

      setTimeout(() => {
        scrollToApplicationForm();
      }, 300);
    } else {
      scrollToApplicationForm();
    }
  };

  // ==========================================
  // DYNAMIC CTA BUTTON NAVIGATION
  // ==========================================

  const handleCTAButtonClick = () => {
    setMenuOpen(false);

    if (isLoginPage) {
      handleApplyClick();
    } else {
      navigate("/login");
    }
  };

  // ==========================================
  // DYNAMIC CTA BUTTON CLASS
  // ==========================================

  const ctaButtonClass = isLoginPage
    ? "navbar-apply-blue"
    : "navbar-signin-green";

  // ==========================================
  // NAVBAR UI
  // ==========================================

  return (
    <div
      className={`public-navbar-wrapper ${
        isScrolled ? "navbar-scrolled" : ""
      }`}
    >
      <nav
        className={`public-navbar ${
          isScrolled ? "public-navbar-glass" : ""
        }`}
      >
        {/* ======================================
            BRAND / LOGO
        ====================================== */}

        <Link
          to="/"
          className="public-navbar-brand"
          onClick={() => {
            setMenuOpen(false);

            if (location.pathname === "/") {
              window.scrollTo({
                top: 0,
                left: 0,
                behavior: "smooth",
              });
            }
          }}
        >
          <img
            src="/logo.png"
            alt="Av_eSAFE"
            className="public-navbar-logo-image"
          />
        </Link>

        {/* ======================================
            DESKTOP NAVIGATION
        ====================================== */}

        <div className="public-navbar-links">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={`public-navbar-link ${
                isActive(link.href) ? "active" : ""
              }`}
              onClick={() =>
                handlePageNavigation(link.href)
              }
            >
              {link.label}
            </Link>
          ))}

          {/* HOW IT WORKS */}

          <button
            type="button"
            className={`public-navbar-link ${
              location.hash === "#process" ? "active" : ""
            }`}
            onClick={() =>
              handleSectionNavigation("process")
            }
          >
            How It Works
          </button>

          {/* FAQ */}

          <button
            type="button"
            className={`public-navbar-link ${
              location.hash === "#faq" ? "active" : ""
            }`}
            onClick={() =>
              handleSectionNavigation("faq")
            }
          >
            FAQs
          </button>
        </div>

        {/* ======================================
            DESKTOP CTA BUTTON
        ====================================== */}

        <button
          type="button"
          className={`public-navbar-apply ${ctaButtonClass}`}
          onClick={handleCTAButtonClick}
        >
          {isLoginPage ? "Apply Now" : "Sign In"}
          <ArrowUpRight size={17} />
        </button>

        {/* ======================================
            MOBILE MENU BUTTON
        ====================================== */}

        <button
          type="button"
          className="public-navbar-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={
            menuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <X size={25} />
          ) : (
            <Menu size={25} />
          )}
        </button>
      </nav>

      {/* ======================================
          MOBILE NAVIGATION
      ====================================== */}

      {menuOpen && (
        <div className="public-navbar-mobile-menu">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={`public-navbar-link ${
                isActive(link.href) ? "active" : ""
              }`}
              onClick={() =>
                handlePageNavigation(link.href)
              }
            >
              {link.label}
            </Link>
          ))}

          {/* HOW IT WORKS */}

          <button
            type="button"
            className="public-navbar-link"
            onClick={() =>
              handleSectionNavigation("process")
            }
          >
            How It Works
          </button>

          {/* FAQ */}

          <button
            type="button"
            className="public-navbar-link"
            onClick={() =>
              handleSectionNavigation("faq")
            }
          >
            FAQs
          </button>

          {/* MOBILE CTA BUTTON */}

          <button
            type="button"
            className={`public-navbar-mobile-apply ${ctaButtonClass}`}
            onClick={handleCTAButtonClick}
          >
            {isLoginPage ? "Apply Now" : "Sign In"}
            <ArrowUpRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
}