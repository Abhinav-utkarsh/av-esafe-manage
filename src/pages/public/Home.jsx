import Navbar from "../../components/public/Navbar";
import Hero from "../../components/public/Hero";
import TrainingTracks from "../../components/public/TrainingTracks";
import HowItWorks from "../../components/public/HowItWorks";
import FounderSection from "../../components/public/FounderSection";
import AboutUs from "../../components/public/AboutUs";
import FAQ from "../../components/public/FAQ";
import ApplySection from "../../components/public/ApplySection";
import Footer from "../../components/public/Footer";

export default function Home() {
  return (
    <div className="public-site">
      {/* Main Navigation */}
      <Navbar />

      <main>
        {/* Hero Section */}
        <Hero />

        {/* Available Training Programs */}
        <TrainingTracks />

        {/* Application & Enrollment Process */}
        <HowItWorks />

        {/* About Av_eSAFE */}
        <AboutUs />

        {/* Frequently Asked Questions */}
        <FAQ />

        {/* Ready to Build + Application Form */}
        <ApplySection />
      </main>

      {/* Website Footer */}
      <Footer />
    </div>
  );
}