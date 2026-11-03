
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Sparkles,
  X,
  BookOpen,
  Brain,
  FileText,
  MessageCircle,
  Code2,
  PackageCheck,
  IndianRupee,
} from "lucide-react";
import "./ApplySection.css";

const DEFAULT_CITIES = [
  "Agra", "Ahmedabad", "Amritsar", "Bengaluru", "Bhopal",
  "Bhubaneswar", "Chandigarh", "Chennai", "Coimbatore",
  "Dehradun", "Delhi", "Faridabad", "Ghaziabad", "Gurugram",
  "Guwahati", "Hyderabad", "Indore", "Jaipur", "Jamshedpur",
  "Kanpur", "Kochi", "Kolkata", "Kozhikode", "Lucknow",
  "Ludhiana", "Madurai", "Mangaluru", "Meerut", "Mumbai",
  "Mysuru", "Nagpur", "Nashik", "Noida", "Patna", "Pune",
  "Raipur", "Rajkot", "Ranchi", "Surat", "Thane",
  "Thiruvananthapuram", "Tiruchirappalli", "Udaipur",
  "Vadodara", "Varanasi", "Vijayawada", "Visakhapatnam",
  "Other",
];

const DEFAULT_COLLEGES = [
  "Acharya Institute of Technology",
  "Amity University",
  "Anna University",
  "BMS College of Engineering",
  "Bangalore Institute of Technology",
  "Bennett University",
  "Birla Institute of Technology and Science",
  "Calicut University",
  "Chandigarh University",
  "Christ University",
  "College of Engineering Pune",
  "Dayananda Sagar College of Engineering",
  "Delhi Technological University",
  "GITAM University",
  "Indian Institute of Science",
  "IIT Bombay",
  "IIT Delhi",
  "IIT Hyderabad",
  "IIT Kanpur",
  "IIT Kharagpur",
  "IIT Madras",
  "Jadavpur University",
  "Jain University",
  "Jawaharlal Nehru University",
  "Kalinga Institute of Industrial Technology",
  "Lovely Professional University",
  "Manipal Institute of Technology",
  "Manipal University",
  "National Institute of Technology Karnataka",
  "National Institute of Technology Tiruchirappalli",
  "Osmania University",
  "PES University",
  "Pune Institute of Computer Technology",
  "Ramaiah Institute of Technology",
  "SRM Institute of Science and Technology",
  "Savitribai Phule Pune University",
  "Thapar Institute of Engineering and Technology",
  "University of Calcutta",
  "University of Delhi",
  "University of Hyderabad",
  "Vellore Institute of Technology",
  "Visvesvaraya Technological University",
  "Other",
];

const CODING_TRACKS = [
  "Web Development",
  "Java Programming",
  "Python Programming",
  "SQL and Database",
  "Software Testing",
  "AI and Generative AI",
];

const SERVICES = [
  {
    id: "aptitude",
    title: "Aptitude Preparation",
    description:
      "Quantitative aptitude, logical reasoning and verbal ability.",
    price: 399,
    icon: Brain,
  },
  {
    id: "resume",
    title: "Resume Builder",
    description:
      "Resume creation, ATS-friendly formatting and improvement guidance.",
    price: 299,
    icon: FileText,
  },
  {
    id: "interview",
    title: "Interview Preparation",
    description:
      "Technical and HR preparation, practice questions and mock interviews.",
    price: 599,
    icon: MessageCircle,
  },
];

const BUNDLES = [
  {
    id: "interview-ready",
    title: "Interview Ready Bundle",
    description:
      "One coding track + aptitude + interview preparation and mock interviews.",
    price: 1399,
    originalPrice: 1597,
    includes: [
      "One coding and technical track",
      "Aptitude preparation",
      "Interview preparation",
      "Mock interviews",
    ],
  },
  {
    id: "career-ready",
    title: "Career Ready Bundle",
    description:
      "A complete package to build technical skills and prepare for placements.",
    price: 1699,
    originalPrice: 1896,
    includes: [
      "One coding and technical track",
      "Aptitude preparation",
      "Resume builder",
      "Interview preparation",
      "Mock interviews",
    ],
  },
];

function formatPrice(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// Replace this placeholder with your verified UPI ID before publishing.
const UPI_ID = "9931805808@ybl";
const PAYEE_NAME = "Av_eSAFE Training";

function ApplySection({
  indianCities = [],
  indianColleges = [],
}) {
  const cities =
    Array.isArray(indianCities) && indianCities.length
      ? indianCities
      : DEFAULT_CITIES;

  const colleges =
    Array.isArray(indianColleges) && indianColleges.length
      ? indianColleges
      : DEFAULT_COLLEGES;

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    college: "",
    currentCity: "",
    track: "",
    currentStatus: "",
    goals: "",
  });

  const [collegeChoice, setCollegeChoice] = useState("");
  const [otherCollege, setOtherCollege] = useState("");
  const [otherCity, setOtherCity] = useState("");

  const [selectionOpen, setSelectionOpen] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBundle, setSelectedBundle] = useState("");
  const [bundleCodingTrack, setBundleCodingTrack] = useState("");
  const [selectionError, setSelectionError] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentStep, setPaymentStep] = useState(false);
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const activeBundle = BUNDLES.find(
    (bundle) => bundle.id === selectedBundle
  );

  const individualTotal =
    selectedTracks.length * 599 +
    SERVICES.reduce(
      (total, service) =>
        total +
        (selectedServices.includes(service.id) ? service.price : 0),
      0
    );

  const totalPrice = activeBundle
    ? activeBundle.price
    : individualTotal;

  const selectionCount = activeBundle
    ? 1
    : selectedTracks.length + selectedServices.length;

  const selectionSummary = activeBundle
    ? `${activeBundle.title} — ${bundleCodingTrack || "Choose a coding track"}`
    : [
        ...selectedTracks,
        ...SERVICES.filter((service) =>
          selectedServices.includes(service.id)
        ).map((service) => service.title),
      ].join(", ");

  function updateField(name, value) {
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrorMessage("");
  }

  function handleChange(event) {
    const { name, value } = event.target;
    updateField(name, value);
  }

  function toggleTrack(track) {
    setSelectedTracks((current) =>
      current.includes(track)
        ? current.filter((item) => item !== track)
        : [...current, track]
    );
    setSelectionError("");
  }

  function toggleService(serviceId) {
    setSelectedServices((current) =>
      current.includes(serviceId)
        ? current.filter((item) => item !== serviceId)
        : [...current, serviceId]
    );
    setSelectionError("");
  }

  function chooseBundle(bundleId) {
    setSelectedBundle((current) =>
      current === bundleId ? "" : bundleId
    );

    // Reset selections when switching bundle options.
    setBundleCodingTrack("");
    setSelectedTracks([]);
    setSelectedServices([]);
    setSelectionError("");
  }

  function chooseIndividualMode() {
    setSelectedBundle("");
    setBundleCodingTrack("");
    setSelectionError("");
  }

  function confirmSelection() {
    if (!activeBundle && selectionCount === 0) {
      setSelectionError(
        "Please select at least one course or bundle."
      );
      return;
    }

    if (activeBundle && !bundleCodingTrack) {
      setSelectionError(
        "Please choose the coding track included in your bundle."
      );
      return;
    }

    const trackNames = activeBundle
      ? [
          `${activeBundle.title} (${bundleCodingTrack})`,
          "Aptitude Preparation",
          ...(activeBundle.id === "career-ready"
            ? ["Resume Builder"]
            : []),
          "Interview Preparation",
          "Mock Interviews",
        ]
      : [
          ...selectedTracks,
          ...SERVICES.filter((service) =>
            selectedServices.includes(service.id)
          ).map((service) => service.title),
        ];

    updateField("track", trackNames.join(", "));
    setSelectionOpen(false);
    setSelectionError("");
  }

  function resetForm() {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      college: "",
      currentCity: "",
      track: "",
      currentStatus: "",
      goals: "",
    });

    setCollegeChoice("");
    setOtherCollege("");
    setOtherCity("");

    setSelectedTracks([]);
    setSelectedServices([]);
    setSelectedBundle("");
    setBundleCodingTrack("");
    setSelectionError("");
    setSelectionOpen(false);

    setSubmitted(false);
    setErrorMessage("");
    setPaymentStep(false);
    setTransactionReference("");
    setPaymentConfirmed(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    if (!formData.track) {
      setErrorMessage(
        "Please select at least one training course or bundle."
      );
      return;
    }

    // First submit displays payment instructions; it does not send the application yet.
    if (!paymentStep) {
      if (UPI_ID === "REPLACE_WITH_YOUR_UPI_ID") {
        setErrorMessage(
          "The payment setup is incomplete. Please configure the UPI ID in ApplySection.jsx."
        );
        return;
      }

      setErrorMessage("");
      setPaymentStep(true);
      return;
    }

    if (!transactionReference.trim()) {
      setErrorMessage("Please enter your UPI transaction reference (UTR).");
      return;
    }

    if (!paymentConfirmed) {
      setErrorMessage("Please confirm that you have completed the UPI payment.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        "https://api.web3forms.com/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            access_key: "b47e9ccd-f83c-403b-96ad-63097d6ff4bb",
            subject: "New Av_eSAFE Training Application",
            from_name: "Av_eSAFE Training Website",

            "Full Name": formData.fullName.trim(),
            "Email Address": formData.email.trim(),
            "Phone Number": formData.phone.trim(),
            "College / University":
              formData.college || "Not provided",
            "Current City":
              formData.currentCity || "Not provided",

            // Retain the existing field for compatibility.
            "Interested Training Track": formData.track,

            // Additional details included in the same API request.
            "Selected Bundle":
              activeBundle?.title || "Individual courses",
            "Bundle Coding Track":
              activeBundle ? bundleCodingTrack : "Not applicable",
            "Selected Courses": formData.track,
            "Total Course Price": formatPrice(totalPrice),
            "Payment Method": "UPI QR",
            "UPI Transaction Reference (UTR)": transactionReference.trim(),
            "Payment Status": "Pending manual verification — verify in bank/UPI account before enrollment",

            "Current Status": formData.currentStatus,
            "Goals": formData.goals.trim() || "Not provided",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to submit your application."
        );
      }

      setSubmitted(true);
    } catch (error) {
      console.error("Web3Forms error:", error);

      setErrorMessage(
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        .course-picker-trigger {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border: 1px solid var(--border-color, #d5dbe5);
          border-radius: 12px;
          background: var(--input-background, transparent);
          color: inherit;
          text-align: left;
          cursor: pointer;
          font: inherit;
          min-height: 54px;
        }

        .course-picker-trigger:hover {
          border-color: var(--accent-color, #6366f1);
        }

        .course-picker-value {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }

        .course-picker-value strong {
          font-size: 14px;
          overflow-wrap: anywhere;
        }

        .course-picker-value small {
          opacity: .72;
          font-size: 12px;
        }

        .course-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(8, 12, 25, .68);
          backdrop-filter: blur(5px);
        }

        .course-modal {
          width: 100%;
          max-width: 760px;
          max-height: min(90vh, 900px);
          overflow-y: auto;
          overscroll-behavior: contain;
          background: var(--card-background, #fff);
          color: var(--text-color, #172033);
          border: 1px solid rgba(128, 128, 128, .2);
          border-radius: 20px;
          box-shadow: 0 25px 80px rgba(0, 0, 0, .28);
        }

        .course-modal-header {
          position: sticky;
          top: 0;
          z-index: 2;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 24px;
          background: var(--card-background, #fff);
          border-bottom: 1px solid rgba(128, 128, 128, .18);
        }

        .course-modal-header h3 {
          margin: 0 0 7px;
          font-size: clamp(20px, 3vw, 26px);
        }

        .course-modal-header p {
          margin: 0;
          font-size: 13px;
          opacity: .72;
          line-height: 1.6;
        }

        .course-modal-close {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(128, 128, 128, .3);
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .course-modal-body {
          padding: 22px 24px;
        }

        .course-modal-section-title {
          margin: 0 0 12px;
          font-size: 15px;
          font-weight: 700;
        }

        .course-option-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .course-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
          padding: 15px;
          border: 1px solid rgba(128, 128, 128, .28);
          border-radius: 13px;
          cursor: pointer;
          transition: border-color .18s, background .18s;
        }

        .course-option:has(input:checked) {
          border-color: var(--accent-color, #6366f1);
          background: rgba(99, 102, 241, .07);
        }

        .course-option input {
          width: 18px;
          height: 18px;
          margin-top: 3px;
          flex-shrink: 0;
          accent-color: var(--accent-color, #6366f1);
          cursor: pointer;
        }

        .course-option-content {
          flex: 1;
          min-width: 0;
        }

        .course-option-content strong {
          display: block;
          font-size: 14px;
          line-height: 1.45;
        }

        .course-option-content p {
          margin: 5px 0 0;
          font-size: 12px;
          line-height: 1.6;
          opacity: .72;
        }

        .course-option-price {
          display: block;
          margin-top: 8px;
          font-weight: 750;
          font-size: 16px;
        }

        .course-modal-divider {
          height: 1px;
          margin: 24px 0;
          background: rgba(128, 128, 128, .22);
        }

        .course-bundle-list {
          display: grid;
          gap: 12px;
        }

        .course-bundle {
          padding: 16px;
          border: 1px solid rgba(128, 128, 128, .28);
          border-radius: 14px;
        }

        .course-bundle.selected {
          border-color: var(--accent-color, #6366f1);
          background: rgba(99, 102, 241, .06);
        }

        .course-bundle-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
        }

        .course-bundle-label input {
          width: 18px;
          height: 18px;
          margin-top: 3px;
          flex-shrink: 0;
          accent-color: var(--accent-color, #6366f1);
        }

        .course-bundle-content {
          flex: 1;
          min-width: 0;
        }

        .course-bundle-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .course-bundle-title-row strong {
          font-size: 15px;
          line-height: 1.5;
        }

        .course-bundle-price {
          text-align: right;
          white-space: nowrap;
        }

        .course-bundle-price strong {
          display: block;
          font-size: 17px;
        }

        .course-bundle-price del {
          font-size: 12px;
          opacity: .6;
        }

        .course-bundle-description {
          margin: 8px 0 10px;
          font-size: 13px;
          line-height: 1.6;
          opacity: .75;
        }

        .course-bundle-includes {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .course-bundle-includes li {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 7px;
          background: rgba(128, 128, 128, .1);
          font-size: 11px;
        }

        .bundle-track-select {
          width: 100%;
          margin-top: 14px;
          padding: 12px;
          border: 1px solid rgba(128, 128, 128, .35);
          border-radius: 9px;
          background: var(--card-background, #fff);
          color: inherit;
          font: inherit;
        }

        .course-modal-error {
          margin: 16px 0 0;
          color: #dc2626;
          font-size: 13px;
          line-height: 1.5;
        }

        .course-modal-footer {
          position: sticky;
          bottom: 0;
          z-index: 2;
          padding: 16px 24px;
          background: var(--card-background, #fff);
          border-top: 1px solid rgba(128, 128, 128, .18);
        }

        .course-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .course-total-row span {
          font-size: 13px;
          opacity: .75;
        }

        .course-total-row strong {
          font-size: clamp(22px, 4vw, 28px);
        }

        .course-modal-actions {
          display: flex;
          gap: 12px;
        }

        .course-modal-actions button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 46px;
          flex: 1;
          border-radius: 10px;
          padding: 12px 16px;
          font: inherit;
          font-weight: 650;
          cursor: pointer;
        }

        .course-cancel-button {
          color: inherit;
          border: 1px solid rgba(128, 128, 128, .35);
          background: transparent;
        }

        .course-confirm-button {
          color: white;
          border: 0;
          background: var(--accent-color, #4f46e5);
        }

        .course-confirm-button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .course-selection-note {
          margin: 8px 0 0;
          font-size: 12px;
          line-height: 1.5;
          opacity: .7;
        }

        .upi-payment-panel {
          margin: 22px 0;
          padding: 22px;
          border: 1px solid rgba(52, 120, 246, .24);
          border-radius: 18px;
          background: linear-gradient(145deg, rgba(52, 120, 246, .07), rgba(52, 120, 246, .025));
        }

        .upi-payment-heading {
          margin: 0 0 6px;
          font-size: 20px;
          font-weight: 750;
        }

        .upi-payment-description {
          margin: 0 0 18px;
          font-size: 13px;
          line-height: 1.65;
          opacity: .78;
        }

        .upi-payment-layout {
          display: grid;
          grid-template-columns: minmax(180px, 230px) minmax(0, 1fr);
          align-items: center;
          gap: 22px;
        }

        .upi-qr-frame {
          display: grid;
          place-items: center;
          padding: 12px;
          background: #fff;
          border: 1px solid rgba(128, 128, 128, .2);
          border-radius: 14px;
        }

        .upi-qr-frame img {
          display: block;
          width: 100%;
          max-width: 210px;
          height: auto;
          aspect-ratio: 1;
          object-fit: contain;
        }

        .upi-payment-details {
          min-width: 0;
        }

        .upi-payment-amount {
          display: block;
          margin-bottom: 8px;
          color: var(--accent-color, #3478f6);
          font-size: 28px;
          font-weight: 800;
        }

        .upi-payment-detail {
          margin: 6px 0;
          font-size: 13px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .upi-payment-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 12px;
          padding: 11px 15px;
          border: 0;
          border-radius: 10px;
          background: var(--accent-color, #3478f6);
          color: #fff;
          text-decoration: none;
          font: inherit;
          font-weight: 700;
        }

        .upi-payment-warning {
          margin: 16px 0 0;
          padding: 11px 12px;
          border-radius: 10px;
          background: rgba(245, 158, 11, .1);
          font-size: 12px;
          line-height: 1.6;
        }

        .upi-payment-confirmation {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 18px;
          font-size: 13px;
          line-height: 1.55;
          cursor: pointer;
        }

        .upi-payment-confirmation input {
          flex: 0 0 auto;
          width: 17px;
          height: 17px;
          margin-top: 2px;
          accent-color: var(--accent-color, #3478f6);
        }

        .upi-payment-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .upi-payment-back {
          min-height: 44px;
          padding: 10px 15px;
          border: 1px solid rgba(128, 128, 128, .35);
          border-radius: 10px;
          background: transparent;
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        @media (max-width: 600px) {
          .upi-payment-panel {
            padding: 16px;
          }

          .upi-payment-layout {
            grid-template-columns: minmax(0, 1fr);
            gap: 16px;
          }

          .upi-qr-frame {
            width: min(100%, 240px);
            justify-self: center;
          }

          .upi-payment-details {
            text-align: center;
          }

          .upi-payment-actions > * {
            flex: 1 1 100%;
          }
        }

        .application-form-only {
          padding: 34px 0;
        }

        .application-form-only-container {
          width: min(100% - 40px, 1250px);
          max-width: 1250px;
          margin-inline: auto;
        }

        .apply-layout-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
          align-items: center;
          gap: clamp(28px, 5vw, 64px);
          padding: clamp(28px, 4vw, 52px);
          border: 1px solid rgba(147, 197, 253, .28);
          border-radius: 28px;
          background: linear-gradient(130deg, #173967 0%, #2459a5 62%, #2f70ed 100%);
          box-shadow: 0 24px 70px rgba(20, 49, 94, .16);
          overflow: hidden;
        }

        .apply-intro-panel {
          display: flex;
          align-items: center;
          min-width: 0;
          color: #fff;
          padding: clamp(12px, 2vw, 24px);
        }

        .apply-intro-content { max-width: 470px; }

        .apply-intro-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 22px;
          color: #a7f3d0;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .apply-intro-content h2 {
          margin: 0 0 18px;
          color: #fff;
          font-size: clamp(30px, 3.4vw, 48px);
          font-weight: 800;
          line-height: 1.18;
          letter-spacing: -1.5px;
        }

        .apply-intro-content > p {
          margin: 0 0 28px;
          color: rgba(239, 246, 255, .84);
          font-size: 14px;
          line-height: 1.8;
        }

        .apply-intro-benefits {
          display: grid;
          gap: 14px;
          padding: 0;
          margin: 0 0 20px;
          list-style: none;
        }

        .apply-intro-benefits li {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #f1f5f9;
          font-size: 14px;
          line-height: 1.5;
        }

        .apply-intro-benefits svg { color: #a7f3d0; flex-shrink: 0; }

        .apply-intro-content > small {
          color: rgba(226, 232, 240, .72);
          font-size: 11px;
          line-height: 1.6;
        }

        .application-form-wrap {
          min-width: 0;
          padding: clamp(22px, 3vw, 36px);
          border: 1px solid rgba(255, 255, 255, .75);
          border-radius: 22px;
          background: #e5edf9;
          color: #183153;
          box-shadow: 0 18px 48px rgba(8, 25, 54, .15);
        }

        .application-form-wrap .application-form {
          color: #183153;
        }

        @media (max-width: 900px) {
          .apply-layout-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 24px;
            padding: 24px;
          }
          .apply-intro-panel { padding: 12px 8px; }
          .apply-intro-content { max-width: 680px; }
          .apply-intro-content h2 { max-width: 600px; }
        }

        @media (max-width: 600px) {
          .application-form-only { padding: 20px 0; }
          .application-form-only-container { width: min(100% - 24px, 1250px); }
          .apply-layout-grid { padding: 16px; gap: 18px; border-radius: 20px; }
          .apply-intro-panel { padding: 8px 4px; }
          .apply-intro-content h2 { font-size: 31px; letter-spacing: -0.8px; }
          .apply-intro-content > p { font-size: 13px; margin-bottom: 20px; }
          .apply-intro-benefits { gap: 11px; }
          .apply-intro-benefits li { font-size: 13px; }
          .application-form-wrap { padding: 18px 14px; border-radius: 16px; }
        }

        @media (max-width: 600px) {
          .course-modal-overlay {
            padding: 8px;
            align-items: center;
          }

          .course-modal {
            max-height: 94dvh;
            border-radius: 15px;
          }

          .course-modal-header {
            padding: 17px;
          }

          .course-modal-body {
            padding: 17px;
          }

          .course-modal-footer {
            padding: 14px 17px;
          }

          .course-option-list {
            grid-template-columns: minmax(0, 1fr);
          }

          .course-option {
            padding: 13px;
          }

          .course-bundle {
            padding: 13px;
          }

          .course-bundle-title-row {
            flex-direction: column;
            gap: 6px;
          }

          .course-bundle-price {
            display: flex;
            align-items: baseline;
            gap: 8px;
            text-align: left;
          }

          .course-modal-actions {
            gap: 8px;
          }

          .course-modal-actions button {
            padding: 11px 8px;
            font-size: 13px;
          }
        }
      `}</style>

      <section className="apply-section application-form-only" id="apply">
        <div className="container application-form-only-container">
          <div className="apply-layout-grid">
            <div className="apply-intro-panel">
              <div className="apply-intro-content">
                <span className="apply-intro-eyebrow">
                  <Sparkles size={15} /> YOUR NEXT STEP STARTS HERE
                </span>
                <h2>
                  Ready to build skills that move you forward?
                </h2>
                <p>
                  Choose the training that matches your career goals. Explore
                  individual courses or save with a career-ready bundle.
                </p>
                <ul className="apply-intro-benefits">
                  <li><Check size={17} /> Practical, project-based learning</li>
                  <li><Check size={17} /> Resume and interview preparation</li>
                  <li><Check size={17} /> Guidance on your next career step</li>
                </ul>
                <small>Training and placement support. No job guarantee.</small>
              </div>
            </div>
            <div className="application-form-wrap">
              {submitted ? (
                <div
                  className="application-success"
                  role="status"
                  aria-live="polite"
                >
                  <span className="application-success-icon">
                    <Check size={28} />
                  </span>

                  <h3>
                    Thank you, {formData.fullName.trim().split(/\s+/)[0]}!
                  </h3>

                  <p>
                    Your application has been submitted successfully.
                    Our team has received your details and will contact
                    you using the information you provided.
                  </p>

                  <button
                    className="button button-primary"
                    type="button"
                    onClick={resetForm}
                  >
                    Submit another application
                    <ArrowRight size={17} />
                  </button>
                </div>
              ) : (
                <form
                  id="application-form"
                  className="application-form"
                  onSubmit={handleSubmit}
                >
                  <div className="application-form-heading">
                    <span>{paymentStep ? "PAYMENT" : "APPLICATION FORM"}</span>
                    <h3>{paymentStep ? "Complete your UPI payment." : "Let’s get to know you."}</h3>
                    <p>
                      {paymentStep
                        ? "Scan the QR code, pay the exact amount, then enter your transaction reference below."
                        : "Fields marked * are required."}
                    </p>
                  </div>

                  <fieldset
                    className="application-field-grid application-fields"
                    disabled={paymentStep}
                    style={{
                      display: paymentStep ? "none" : undefined,
                      border: "none",
                      padding: 0,
                      margin: 0,
                      minWidth: 0,
                    }}
                  >
                    <label className="application-field">
                      <span>Full name *</span>
                      <input
                        type="text"
                        name="fullName"
                        autoComplete="name"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={handleChange}
                        minLength={2}
                        required
                      />
                    </label>

                    <label className="application-field">
                      <span>Email address *</span>
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </label>

                    <label className="application-field">
                      <span>Phone number *</span>
                      <input
                        type="tel"
                        name="phone"
                        autoComplete="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={handleChange}
                        minLength={10}
                        required
                      />
                    </label>

                    <label className="application-field">
                      <span>College / University *</span>
                      <input
                        type="text"
                        name="collegeChoice"
                        list="college-suggestions"
                        placeholder="Type to search colleges"
                        value={collegeChoice}
                        onChange={(event) => {
                          const value = event.target.value;

                          setCollegeChoice(value);
                          setOtherCollege("");

                          updateField(
                            "college",
                            value === "Other" ? "" : value
                          );
                        }}
                        autoComplete="off"
                        required
                      />

                      <datalist id="college-suggestions">
                        {colleges.map((college, index) => (
                          <option
                            key={`${college}-${index}`}
                            value={college}
                          />
                        ))}
                      </datalist>

                      {collegeChoice === "Other" && (
                        <input
                          type="text"
                          name="otherCollege"
                          placeholder="Enter your college name"
                          value={otherCollege}
                          onChange={(event) => {
                            const value = event.target.value;
                            setOtherCollege(value);
                            updateField("college", value);
                          }}
                          required
                        />
                      )}
                    </label>

                    <label className="application-field">
                      <span>Current city *</span>
                      <input
                        type="text"
                        name="currentCity"
                        list="city-suggestions"
                        placeholder="Type to search cities"
                        value={formData.currentCity}
                        onChange={(event) => {
                          const value = event.target.value;
                          updateField("currentCity", value);
                          setOtherCity(value === "Other" ? "" : value);
                        }}
                        autoComplete="off"
                        required
                      />

                      <datalist id="city-suggestions">
                        {cities.map((city, index) => (
                          <option
                            key={`${city}-${index}`}
                            value={city}
                          />
                        ))}
                      </datalist>

                      {formData.currentCity === "Other" && (
                        <input
                          type="text"
                          name="otherCity"
                          placeholder="Enter your city"
                          value={otherCity}
                          onChange={(event) => {
                            const value = event.target.value;
                            setOtherCity(value);
                            updateField("currentCity", value);
                          }}
                          required
                        />
                      )}
                    </label>

                    <label className="application-field application-field-full">
                      <span>Current status *</span>
                      <select
                        name="currentStatus"
                        value={formData.currentStatus}
                        onChange={handleChange}
                        required
                      >
                        <option value="">
                          Choose your current status
                        </option>
                        <option value="Student">Student</option>
                        <option value="Recent graduate">
                          Recent graduate
                        </option>
                        <option value="Working professional">
                          Working professional
                        </option>
                        <option value="Career switcher">
                          Looking to switch careers
                        </option>
                      </select>
                    </label>


                    <div className="application-field">
                      <span>Interested training track *</span>

                      <button
                        type="button"
                        className="course-picker-trigger"
                        onClick={() => {
                          setSelectionError("");
                          setSelectionOpen(true);
                        }}
                        aria-haspopup="dialog"
                        aria-expanded={selectionOpen}
                      >
                        <span className="course-picker-value">
                          <strong>
                            {formData.track
                              ? `${selectionCount} selection${selectionCount === 1 ? "" : "s"} confirmed`
                              : "Choose courses or a bundle"}
                          </strong>

                          <small>
                            {formData.track
                              ? `${formatPrice(totalPrice)} · Click to edit`
                              : "View courses, bundles and prices"}
                          </small>
                        </span>

                        <ArrowRight size={19} />
                      </button>

                      {formData.track && (
                        <p className="course-selection-note">
                          {formData.track}
                        </p>
                      )}
                    </div>

                    <label className="application-field application-field-full">
                      <span>Your goals (optional)</span>
                      <textarea
                        name="goals"
                        placeholder="Tell us what you want to learn or achieve"
                        value={formData.goals}
                        onChange={handleChange}
                        rows={3}
                      />
                    </label>
                  </fieldset>

                  {paymentStep && (
                    <section className="upi-payment-panel" aria-labelledby="upi-payment-title">
                      <h4 className="upi-payment-heading" id="upi-payment-title">
                        Pay {formatPrice(totalPrice)} using UPI
                      </h4>
                      <p className="upi-payment-description">
                        Scan this QR code with your UPI app. Before confirming payment, verify that the payee and amount shown in your app are correct.
                      </p>

                      <div className="upi-payment-layout">
                        <div className="upi-qr-frame">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                              `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${totalPrice.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Av_eSAFE training")}`
                            )}`}
                            alt={`UPI payment QR code for ${formatPrice(totalPrice)}`}
                            loading="eager"
                          />
                        </div>

                        <div className="upi-payment-details">
                          <span className="upi-payment-amount">{formatPrice(totalPrice)}</span>
                          <p className="upi-payment-detail"><strong>Pay to:</strong> {PAYEE_NAME}</p>
                          <p className="upi-payment-detail"><strong>UPI ID:</strong> {UPI_ID}</p>
                          <a
                            className="upi-payment-link"
                            href={`upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${totalPrice.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Av_eSAFE training")}`}
                          >
                            Open UPI app <IndianRupee size={16} />
                          </a>
                        </div>
                      </div>

                      <p className="upi-payment-warning">
                        Payment is not verified automatically. After paying, enter the UTR/reference number from your UPI app. Av_eSAFE will verify the transaction before confirming enrollment. Do not pay if the payee or amount is incorrect.
                      </p>

                      <label className="application-field" style={{ display: "block", marginTop: 18 }}>
                        <span>UPI transaction reference / UTR *</span>
                        <input
                          type="text"
                          name="transactionReference"
                          placeholder="Enter the UTR shown in your UPI app"
                          value={transactionReference}
                          onChange={(event) => {
                            setTransactionReference(event.target.value);
                            setErrorMessage("");
                          }}
                          autoComplete="off"
                          required={paymentStep}
                          minLength={6}
                        />
                      </label>

                      <label className="upi-payment-confirmation">
                        <input
                          type="checkbox"
                          checked={paymentConfirmed}
                          onChange={(event) => {
                            setPaymentConfirmed(event.target.checked);
                            setErrorMessage("");
                          }}
                          required={paymentStep}
                        />
                        <span>I have completed the payment and entered the transaction reference. I understand that my application remains pending until Av_eSAFE verifies the payment.</span>
                      </label>

                      <div className="upi-payment-actions">
                        <button
                          type="button"
                          className="upi-payment-back"
                          onClick={() => {
                            setPaymentStep(false);
                            setTransactionReference("");
                            setPaymentConfirmed(false);
                            setErrorMessage("");
                          }}
                          disabled={submitting}
                        >
                          Back to application
                        </button>
                      </div>
                    </section>
                  )}

                  {errorMessage && (
                    <p
                      className="application-error"
                      role="alert"
                      aria-live="polite"
                    >
                      {errorMessage}
                    </p>
                  )}

                  <button
                    className="button button-primary application-submit"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Submitting..."
                      : paymentStep
                        ? "Submit for payment verification"
                        : "Continue to payment"}

                    {!submitting && <ArrowRight size={18} />}
                  </button>

                  <p className="application-privacy-note">
                    Your information should only be collected and handled
                    in accordance with Av_eSAFE’s privacy practices.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {selectionOpen && (
        <div
          className="course-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectionOpen(false);
              setSelectionError("");
            }
          }}
        >
          <div
            className="course-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-modal-title"
          >
            <div className="course-modal-header">
              <div>
                <h3 id="course-modal-title">
                  Build your learning plan
                </h3>
                <p>
                  Select individual courses or choose one bundle.
                  Your total updates automatically.
                </p>
              </div>

              <button
                type="button"
                className="course-modal-close"
                aria-label="Close course selection"
                onClick={() => {
                  setSelectionOpen(false);
                  setSelectionError("");
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="course-modal-body">
              <h4 className="course-modal-section-title">
                <Code2
                  size={17}
                  style={{
                    verticalAlign: "middle",
                    marginRight: 7,
                  }}
                />
                Individual courses
              </h4>

              <p className="course-selection-note">
                Select one or more courses. Each coding and technical
                track costs ₹599. Other courses have individual prices.
                Choosing a bundle clears individual selections.
              </p>

              <div className="course-option-list">
                {CODING_TRACKS.map((track) => (
                  <label className="course-option" key={track}>
                    <input
                      type="checkbox"
                      checked={selectedTracks.includes(track)}
                      disabled={Boolean(selectedBundle)}
                      onChange={() => toggleTrack(track)}
                    />

                    <span className="course-option-content">
                      <strong>{track}</strong>
                      <p>Coding and technical training</p>
                      <span className="course-option-price">
                        ₹599
                      </span>
                    </span>
                  </label>
                ))}

                {SERVICES.map((service) => {
                  const ServiceIcon = service.icon;

                  return (
                    <label
                      className="course-option"
                      key={service.id}
                    >
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.id)}
                        disabled={Boolean(selectedBundle)}
                        onChange={() => toggleService(service.id)}
                      />

                      <span className="course-option-content">
                        <strong>
                          <ServiceIcon
                            size={15}
                            style={{
                              verticalAlign: "middle",
                              marginRight: 5,
                            }}
                          />
                          {service.title}
                        </strong>

                        <p>{service.description}</p>

                        <span className="course-option-price">
                          {formatPrice(service.price)}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="course-modal-divider" />

              <h4 className="course-modal-section-title">
                <PackageCheck
                  size={18}
                  style={{
                    verticalAlign: "middle",
                    marginRight: 7,
                  }}
                />
                Career bundles
              </h4>

              <div className="course-bundle-list">
                {BUNDLES.map((bundle) => {
                  const isSelected = selectedBundle === bundle.id;

                  return (
                    <div
                      className={`course-bundle ${isSelected ? "selected" : ""}`}
                      key={bundle.id}
                    >
                      <label className="course-bundle-label">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => chooseBundle(bundle.id)}
                        />

                        <span className="course-bundle-content">
                          <span className="course-bundle-title-row">
                            <strong>{bundle.title}</strong>

                            <span className="course-bundle-price">
                              <strong>
                                {formatPrice(bundle.price)}
                              </strong>

                              <del>
                                {formatPrice(bundle.originalPrice)}
                              </del>
                            </span>
                          </span>

                          <p className="course-bundle-description">
                            {bundle.description}
                          </p>

                          <ul className="course-bundle-includes">
                            {bundle.includes.map((item) => (
                              <li key={item}>
                                <Check size={12} />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </span>
                      </label>

                      {isSelected && (
                        <select
                          className="bundle-track-select"
                          aria-label={`Choose coding track for ${bundle.title}`}
                          value={bundleCodingTrack}
                          onChange={(event) => {
                            setBundleCodingTrack(event.target.value);
                            setSelectionError("");
                          }}
                        >
                          <option value="">
                            Choose the coding track in this bundle
                          </option>

                          {CODING_TRACKS.map((track) => (
                            <option key={track} value={track}>
                              {track}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectionError && (
                <p
                  className="course-modal-error"
                  role="alert"
                >
                  {selectionError}
                </p>
              )}
            </div>

            <div className="course-modal-footer">
              <div className="course-total-row">
                <span>
                  {activeBundle
                    ? activeBundle.title
                    : `${selectionCount} course${selectionCount === 1 ? "" : "s"} selected`}
                </span>

                <strong>{formatPrice(totalPrice)}</strong>
              </div>

              <div className="course-modal-actions">
                <button
                  type="button"
                  className="course-cancel-button"
                  onClick={() => {
                    setSelectionOpen(false);
                    setSelectionError("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="course-confirm-button"
                  onClick={confirmSelection}
                  disabled={
                    activeBundle
                      ? !bundleCodingTrack
                      : selectionCount === 0
                  }
                >
                  Confirm selection
                  <Check size={17} />
                </button>
              </div>

              <p className="course-selection-note">
                Review your selection before submitting the application.
                Final enrollment and payment arrangements can be confirmed
                by the Av_eSAFE team.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ApplySection;
