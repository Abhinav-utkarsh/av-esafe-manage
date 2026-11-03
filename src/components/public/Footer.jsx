
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-inner">
          
<div className="footer-brand">
  <a href="/" className="footer-logo">
    Av_<span>eSAFE</span>
  </a>

  <p className="footer-tagline">
    Classroom to Career-Ready
  </p>

  <p>
    Learn, build, and become career-ready with
    practical training and career support.
  </p>
</div>


          <div className="footer-links">
            <h3>Explore</h3>
            <a href="/">Home</a>
            <a href="/about">About Us</a>
            <a href="/founder">Meet Our Founder</a>
            <a href="/#tracks">Training Programs</a>
          </div>

          <div className="footer-links">
            <h3>Get Started</h3>
            <a href="/#apply">Apply Now</a>
            <a href="/#faq">FAQs</a>
            <a href="/#process">How It Works</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Av_eSAFE.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
