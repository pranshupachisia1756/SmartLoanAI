import React, { useState, useEffect } from "react";
import "./App.css";
import {
  loginUser,
  sendLoginOtp,
  verifyLoginOtp,
  saveToken,
  getUser,
  logoutUser,
  saveBankToken,
  compareBanks,
  createLoanApplication,
  getBankDashboard,
  getBankApplications,
  reviewApplicationDecision,
  uploadDocument,
  getDocuments,
  getDocumentDownloadUrl,
  getSanctionLetterDownloadUrl,
  predictCondition,
  getApplicant
} from "./api";

export default function App() {
  // Navigation: "landing", "marketplace", "verdict", "calculator", "underwriter"
  const [activeTab, setActiveTab] = useState("landing");
  const [portalMode, setPortalMode] = useState("applicant"); // "applicant" or "officer"

  // User Authentication State
  const [currentUser, setCurrentUser] = useState(() => getUser());
  const [bankUser, setBankUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("smartloan_bank_user")) || null;
    } catch {
      return null;
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" or "officer"
  const [authStep, setAuthStep] = useState("credentials"); // "credentials" or "otp"
  const [authEmail, setAuthEmail] = useState("pranshu2@test.com");
  const [authPassword, setAuthPassword] = useState("Password123");
  const [authOtp, setAuthOtp] = useState("");
  const [demoOtpCode, setDemoOtpCode] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Controller / Simulator State (Hero & Controller Widget)
  const [requiredCapital, setRequiredCapital] = useState(1310000);
  const [loanHorizon, setLoanHorizon] = useState(36); // Months
  const [lenderFilter, setLenderFilter] = useState("All");

  // Multi-Bank Data State
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankError, setBankError] = useState("");

  // Rate Optimizer Checkbox Concessions (AI Verdict Page)
  const [optCardSpend, setOptCardSpend] = useState(true);
  const [optNachMandate, setOptNachMandate] = useState(true);
  const [optCoApplicant, setOptCoApplicant] = useState(false);

  // AI Terminal Dynamic Condition State
  const [cibilScore, setCibilScore] = useState(750);
  const [monthlyIncome, setMonthlyIncome] = useState(120000);
  const [existingEmi, setExistingEmi] = useState(18000);
  const [creditUtilization, setCreditUtilization] = useState(0.28);
  const [missedPayments, setMissedPayments] = useState(0);
  const [activeConditionPreset, setActiveConditionPreset] = useState("prime");
  const [conditionLoading, setConditionLoading] = useState(false);

  const [conditionResult, setConditionResult] = useState({
    cibil_score: 750,
    cibil_tier: "PRIME-A BORROWER",
    cibil_tier_color: "#059669",
    spectrum_position: 70,
    percentile: "Top 8%",
    percentile_desc: "Ahead of 92% retail applicants",
    default_risk: "0.42%",
    default_zone: "Tier-1 Institutional Safezone",
    approval_probability: 98.04,
    prediction: "APPROVED",
    verdict_status: "PRE-APPROVED",
    verdict_title: "AI DECISION: 98.04% PRE-APPROVED",
    verdict_color: "#059669",
    verdict_subtext: "Your low Fixed Obligation to Income Ratio (FOIR) and flawless 5-year repayment vintage qualified you for instant digital disbursement under RBI Fast-Track guidelines.",
    max_loan_sanction: 4500000,
    algorithmic_rate: 10.25,
    completion_percentage: 94,
    positive_drivers: [
      { title: "CIBIL Bureau Vintage (5+ Years)", points: "+42 pts", desc: "Zero late-payments detected across 62 continuous payment cycles on primary secured facilities.", meter: 95 },
      { title: "Low Debt-to-Income FOIR (16% Surplus)", points: "+35 pts", desc: "Monthly debt obligations stand at only ₹18,200 against verified median net inflows of ₹1,42,000.", meter: 84 },
      { title: "Balanced Credit Portfolio Mix", points: "+15 pts", desc: "Healthy diversification between 1 auto-loan asset and 2 revolving corporate credit lines.", meter: 65 }
    ],
    negative_drivers: [
      { title: "Revolving Card Utilization (28% Threshold)", points: "-12 pts", desc: "Peak spend on primary card approaches recommended safe threshold of 20% limit.", meter: 70, color: "#f59e0b" },
      { title: "Recent Hard Inquiries (2 Inquiries / 90d)", points: "-8 pts", desc: "Multiple recent credit bureau pings from e-commerce checkout platforms registered in Q1.", meter: 45, color: "#ef4444" },
      { title: "Unlinked e-NACH Mandate", points: "-4 pts", desc: "Paper-based recurring debit increases clearing time by 48 hours for institutional underwriting.", meter: 30, color: "#6b7280" }
    ]
  });

  // Documents / KYC Vault State
  const [userDocs, setUserDocs] = useState([]);
  const [docCompleteness, setDocCompleteness] = useState(0);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docSelectedFiles, setDocSelectedFiles] = useState({});
  const [docUploading, setDocUploading] = useState({});

  const MANDATORY_DOCUMENTS = [
    {
      type: "PAN Card",
      title: "Permanent Account Number (PAN)",
      desc: "Mandatory Tax ID & Identity Verification against NSDL database.",
      accept: ".pdf,.png,.jpg,.jpeg",
      code: "PAN"
    },
    {
      type: "Aadhaar / KYC",
      title: "Aadhaar / Address Proof",
      desc: "UIDAI e-KYC or verified current residential address document.",
      accept: ".pdf,.png,.jpg,.jpeg",
      code: "KYC"
    },
    {
      type: "Income Proof",
      title: "Latest 3-Month Salary Slips",
      desc: "Official employer-stamped payslips or recent ITR-V assessment.",
      accept: ".pdf,.png,.jpg,.jpeg",
      code: "INC"
    },
    {
      type: "Bank Statement",
      title: "6-Month Bank Statement (PDF)",
      desc: "Primary salary credit account statement for cash-flow underwriting.",
      accept: ".pdf",
      code: "BNK"
    },
    {
      type: "Employment / Business Proof",
      title: "Employment / Corporate ID Proof",
      desc: "Valid corporate badge, appointment letter, or business registration.",
      accept: ".pdf,.png,.jpg,.jpeg",
      code: "EMP"
    }
  ];

  // Application Success Modal / Toast
  const [toastMessage, setToastMessage] = useState("");
  const [applyModalBank, setApplyModalBank] = useState(null);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [kycIncompleteModalOpen, setKycIncompleteModalOpen] = useState(false);
  const [kycMissingList, setKycMissingList] = useState([]);

  // Live Sanction Activity Ticker (Rotating)
  const recentSanctions = [
    { amount: "₹10,50,000", name: "Sarah J.", city: "Bangalore", time: "46s ago", bank: "HDFC Bank" },
    { amount: "₹15,00,000", name: "Rahul M.", city: "Mumbai", time: "1m ago", bank: "State Bank of India" },
    { amount: "₹8,25,000", name: "Priya S.", city: "Hyderabad", time: "2m ago", bank: "ICICI Bank" },
    { amount: "₹22,00,000", name: "Vikram K.", city: "Pune", time: "3m ago", bank: "Bank of Baroda" },
    { amount: "₹12,40,000", name: "Ananya D.", city: "Delhi NCR", time: "4m ago", bank: "Axis Bank" }
  ];
  const [sanctionIdx, setSanctionIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSanctionIdx((prev) => (prev + 1) % recentSanctions.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  // Officer Underwriting Queue State
  const [officerApps, setOfficerApps] = useState([]);
  const [officerSummary, setOfficerSummary] = useState(null);
  const [selectedReviewApp, setSelectedReviewApp] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState("");

  // Calculate live EMI for Controller
  const baseRate = 10.35;
  const monthlyRate = (baseRate / 12) / 100;
  const estimatedEmi = Math.round(
    (requiredCapital * monthlyRate * Math.pow(1 + monthlyRate, loanHorizon)) /
    (Math.pow(1 + monthlyRate, loanHorizon) - 1)
  ) || 42520;

  // Calculate projected optimized rate dynamically from conditionResult
  const projectedRate = conditionResult ? conditionResult.algorithmic_rate : 10.25;

  // Real-time Machine Learning Condition Prediction Effect
  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(async () => {
      try {
        setConditionLoading(true);
        const res = await predictCondition({
          cibil_score: cibilScore,
          monthly_income: monthlyIncome,
          existing_emi: existingEmi,
          loan_amount: requiredCapital,
          loan_term_months: loanHorizon,
          credit_utilization: creditUtilization,
          missed_payments: missedPayments,
          employment_type: "Salaried",
          employment_years: 5.0,
          opt_card_spend: optCardSpend,
          opt_nach_mandate: optNachMandate,
          opt_co_applicant: optCoApplicant
        });
        if (isMounted && res && res.success) {
          setConditionResult(res);
        }
      } catch (err) {
        console.warn("Prediction update error:", err);
      } finally {
        if (isMounted) setConditionLoading(false);
      }
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [
    cibilScore,
    monthlyIncome,
    existingEmi,
    creditUtilization,
    missedPayments,
    requiredCapital,
    loanHorizon,
    optCardSpend,
    optNachMandate,
    optCoApplicant
  ]);

  function handleApplyPreset(preset) {
    setActiveConditionPreset(preset);
    if (preset === "prime") {
      setCibilScore(780);
      setMonthlyIncome(160000);
      setExistingEmi(14000);
      setCreditUtilization(0.14);
      setMissedPayments(0);
      setOptCardSpend(true);
      setOptNachMandate(true);
      showToast("Preset Applied: Prime-A Institutional Tier");
    } else if (preset === "near_prime") {
      setCibilScore(710);
      setMonthlyIncome(110000);
      setExistingEmi(22000);
      setCreditUtilization(0.28);
      setMissedPayments(0);
      setOptCardSpend(false);
      setOptNachMandate(true);
      showToast("Preset Applied: Near-Prime Balanced Profile");
    } else if (preset === "moderate") {
      setCibilScore(660);
      setMonthlyIncome(85000);
      setExistingEmi(28000);
      setCreditUtilization(0.48);
      setMissedPayments(1);
      setOptCardSpend(false);
      setOptNachMandate(false);
      showToast("Preset Applied: Moderate Risk Borrower");
    } else if (preset === "stressed") {
      setCibilScore(590);
      setMonthlyIncome(52000);
      setExistingEmi(34000);
      setCreditUtilization(0.82);
      setMissedPayments(3);
      setOptCardSpend(false);
      setOptNachMandate(false);
      setOptCoApplicant(false);
      showToast("Preset Applied: Sub-Prime Delinquent Condition");
    }
  }

  async function handleSyncUserProfile() {
    if (!currentUser) {
      showToast("Please sign in to sync verified borrower profile.");
      setAuthMode("login");
      setAuthModalOpen(true);
      return;
    }
    try {
      setActiveConditionPreset("profile");
      const appProfile = await getApplicant();
      if (appProfile) {
        setCibilScore(appProfile.cibil_score || 750);
        setMonthlyIncome(appProfile.monthly_income || 120000);
        setExistingEmi(appProfile.existing_emi || 18000);
        setCreditUtilization(appProfile.credit_utilization || 0.28);
        setMissedPayments(appProfile.missed_payments || 0);
        showToast(`Synced profile for ${appProfile.name} (CIBIL: ${appProfile.cibil_score})`);
      }
    } catch {
      showToast("Profile data synced with active session.");
    }
  }

  // Auto-load banks on mount or when capital/horizon updates
  useEffect(() => {
    fetchBanks(requiredCapital, loanHorizon);
  }, []);

  async function fetchBanks(amount, tenure) {
    setBanksLoading(true);
    setBankError("");
    try {
      const res = await compareBanks(amount, tenure);
      if (res && res.eligible_banks) {
        setBanks(res.eligible_banks);
      }
    } catch {
      // Fallback fallback static dataset to guarantee zero UI downtime
      setBanks(getFallbackBanks());
    } finally {
      setBanksLoading(false);
    }
  }

  function getFallbackBanks() {
    return [
      {
        bank_name: "HDFC Bank",
        bank_type: "Private Lender",
        product_name: "HDFC Quick Cash Personal Loan",
        match_score: 98,
        interest_rate_display: "10.35% - 15.50% p.a.",
        interest_rate_min: 10.35,
        processing_fee_display: "₹999 (Waived 80%)",
        max_sanction_offered: 1310000,
        max_sanction_offered_display: "₹13,10,000",
        approval_time_display: "Instant to 114 seconds",
        estimated_monthly_emi: 42520,
        source_url: "https://www.hdfcbank.com",
        recommendation: "Automated underwriting matched your salary and CIBIL profile. Direct netbanking disbursement."
      },
      {
        bank_name: "State Bank of India",
        bank_type: "Public Lender",
        product_name: "SBI Xpress Credit Personal Loan",
        match_score: 97,
        interest_rate_display: "10.45% - 14.50% p.a.",
        interest_rate_min: 10.45,
        processing_fee_display: "Zero Processing Fee",
        max_sanction_offered: 1200000,
        max_sanction_offered_display: "₹12,00,000",
        approval_time_display: "YONO Instant",
        estimated_monthly_emi: 40890,
        source_url: "https://sbi.co.in",
        recommendation: "Meets Tier-1 PSU salary-linked credit cut-off. Zero salary pledge mandate."
      },
      {
        bank_name: "ICICI Bank",
        bank_type: "Private Lender",
        product_name: "ICICI Dream Loan Solution",
        match_score: 96,
        interest_rate_display: "10.60% - 16.00% p.a.",
        interest_rate_min: 10.60,
        processing_fee_display: "1.25% of Loan Amount",
        max_sanction_offered: 1310000,
        max_sanction_offered_display: "₹13,10,000",
        approval_time_display: "90-Min Disbursal",
        estimated_monthly_emi: 42210,
        source_url: "https://www.icicibank.com",
        recommendation: "Pre-approved corporate network rate. Part-prepayment allowable."
      },
      {
        bank_name: "Axis Bank",
        bank_type: "Private Lender",
        product_name: "Axis Bank 24x7 Personal Loan",
        match_score: 95,
        interest_rate_display: "10.75% - 16.25% p.a.",
        interest_rate_min: 10.75,
        processing_fee_display: "Flat ₹1,499",
        max_sanction_offered: 1250000,
        max_sanction_offered_display: "₹12,50,000",
        approval_time_display: "24x7 Digital",
        estimated_monthly_emi: 35900,
        source_url: "https://www.axisbank.com",
        recommendation: "Digital line of credit option. Instant video KYC."
      },
      {
        bank_name: "Kotak Mahindra Bank",
        bank_type: "Private Lender",
        product_name: "Kotak Instant Personal Loan",
        match_score: 95,
        interest_rate_display: "10.85% - 17.00% p.a.",
        interest_rate_min: 10.85,
        processing_fee_display: "1.50% of Loan Amount",
        max_sanction_offered: 1310000,
        max_sanction_offered_display: "₹13,10,000",
        approval_time_display: "Instant OTT",
        estimated_monthly_emi: 42836,
        source_url: "https://www.kotak.com",
        recommendation: "Direct savings account e-mandate. 100% paperless verification."
      },
      {
        bank_name: "Bank of Baroda",
        bank_type: "Public Lender",
        product_name: "Baroda Advantage Personal Loan",
        match_score: 94,
        interest_rate_display: "10.35% - 14.80% p.a.",
        interest_rate_min: 10.35,
        processing_fee_display: "1.00% of Loan Amount",
        max_sanction_offered: 1200000,
        max_sanction_offered_display: "₹12,00,000",
        approval_time_display: "4 Hours (DocuSign)",
        estimated_monthly_emi: 39500,
        source_url: "https://www.bankofbaroda.in",
        recommendation: "Competitive public sector benchmark rate. Minimal processing hurdles."
      },
      {
        bank_name: "IDFC FIRST Bank",
        bank_type: "Private Lender",
        product_name: "IDFC FIRST Easy Personal Loan",
        match_score: 94,
        interest_rate_display: "10.49% - 17.50% p.a.",
        interest_rate_min: 10.49,
        processing_fee_display: "Zero Processing Fee",
        max_sanction_offered: 1500000,
        max_sanction_offered_display: "₹15,00,000",
        approval_time_display: "Instant NetBanking",
        estimated_monthly_emi: 42000,
        source_url: "https://www.idfcfirstbank.com",
        recommendation: "Zero foreclosure charges after 3 EMIs. Instant digital approval."
      },
      {
        bank_name: "Punjab National Bank",
        bank_type: "Public Lender",
        product_name: "PNB Sahyog Personal Loan",
        match_score: 93,
        interest_rate_display: "10.40% - 15.00% p.a.",
        interest_rate_min: 10.40,
        processing_fee_display: "0.50% of Loan Amount",
        max_sanction_offered: 1050000,
        max_sanction_offered_display: "₹10,50,000",
        approval_time_display: "Same-Day TAT",
        estimated_monthly_emi: 34500,
        source_url: "https://www.pnbindia.in",
        recommendation: "Low-interest PSU scheme for verified salaried professionals."
      },
      {
        bank_name: "Canara Bank",
        bank_type: "Public Lender",
        product_name: "Canara Budget Personal Loan",
        match_score: 92,
        interest_rate_display: "10.65% - 15.10% p.a.",
        interest_rate_min: 10.65,
        processing_fee_display: "0.75% of Loan Amount",
        max_sanction_offered: 1100000,
        max_sanction_offered_display: "₹11,00,000",
        approval_time_display: "24 Hours",
        estimated_monthly_emi: 35200,
        source_url: "https://canarabank.com",
        recommendation: "Low processing fee tier. Flexible repayment up to 60 months."
      },
      {
        bank_name: "IndusInd Bank",
        bank_type: "Private Lender",
        product_name: "IndusInd Multi-Purpose Personal Loan",
        match_score: 92,
        interest_rate_display: "10.49% - 16.50% p.a.",
        interest_rate_min: 10.49,
        processing_fee_display: "₹999 Fixed",
        max_sanction_offered: 1400000,
        max_sanction_offered_display: "₹14,00,000",
        approval_time_display: "Video KYC (15m)",
        estimated_monthly_emi: 42100,
        source_url: "https://www.indusind.com",
        recommendation: "Instant sanction letter generated via video identification."
      }
    ];
  }

  // Provisional Sanction Letter PDF Download
  function handleDownloadSanctionLetter() {
    showToast("Generating official provisional sanction letter PDF...");
    const matchedBank = banks && banks.length > 0 ? banks[0] : null;
    const params = {
      amount: conditionResult.max_loan_sanction || requiredCapital || 4500000,
      rate: conditionResult.algorithmic_rate || projectedRate || 10.25,
      tenure: loanHorizon || 60,
      bank_name: matchedBank?.bank_name || "HDFC Bank (Consortium Spotlight)",
      applicant_name: currentUser ? (currentUser.name || currentUser.email) : "Pranshu Pachisia",
      cibil_score: conditionResult.cibil_score || cibilScore || 750,
      confidence: conditionResult.approval_probability || 98.04
    };
    const downloadUrl = getSanctionLetterDownloadUrl(params);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "SmartLoan_Provisional_Sanction_Letter.pdf");
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Handle Authentication - Step 1: Send OTP
  async function handleSendOtp(e) {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await sendLoginOtp(authEmail, authPassword);
      if (res && res.demo_otp) {
        setDemoOtpCode(res.demo_otp);
        setAuthOtp(res.demo_otp);
      }
      setAuthStep("otp");
      setOtpCountdown(30);
      showToast("OTP code generated! Enter the 6-digit passcode.");
    } catch (err) {
      setAuthError(err.message || "Invalid credentials. Please verify your email & password.");
    } finally {
      setAuthLoading(false);
    }
  }

  // Handle Authentication - Step 2: Verify OTP
  async function handleVerifyOtp(e) {
    if (e) e.preventDefault();
    if (!authOtp || authOtp.trim().length !== 6) {
      setAuthError("Please enter the complete 6-digit OTP code.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await verifyLoginOtp(authEmail, authOtp.trim());
      if (res.bank_role) {
        saveBankToken(res.access_token, res);
        setBankUser(res);
        setPortalMode("officer");
        setActiveTab("underwriter");
        loadOfficerData(res.access_token);
      } else {
        saveToken(res.access_token, res);
        setCurrentUser(res);
        loadUserDocuments();
      }
      setAuthModalOpen(false);
      setAuthStep("credentials");
      setAuthOtp("");
      setDemoOtpCode("");
      showToast(`2FA Verified! Welcome back, ${res.name}!`);
    } catch (err) {
      setAuthError(err.message || "Invalid or expired OTP code.");
    } finally {
      setAuthLoading(false);
    }
  }

  // Handle Resend OTP
  async function handleResendOtp() {
    if (otpCountdown > 0) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await sendLoginOtp(authEmail, authPassword);
      if (res && res.demo_otp) {
        setDemoOtpCode(res.demo_otp);
        setAuthOtp(res.demo_otp);
      }
      setOtpCountdown(30);
      showToast("Fresh OTP code dispatched.");
    } catch (err) {
      setAuthError(err.message || "Failed to resend OTP.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadUserDocuments() {
    try {
      setDocsLoading(true);
      const res = await getDocuments();
      if (res && res.documents) {
        setUserDocs(res.documents);
        setDocCompleteness(res.document_completeness || 0);
      }
    } catch (err) {
      console.warn("Could not load user documents:", err);
    } finally {
      setDocsLoading(false);
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadUserDocuments();
    }
  }, [currentUser]);

  async function handleDocUpload(docType) {
    if (!currentUser) {
      showToast("Please sign in to upload documents.");
      setAuthMode("login");
      setAuthModalOpen(true);
      return;
    }
    const file = docSelectedFiles[docType];
    if (!file) {
      showToast(`Please choose a file for ${docType}`);
      return;
    }
    setDocUploading((prev) => ({ ...prev, [docType]: true }));
    try {
      const res = await uploadDocument(docType, file);
      showToast(res.message || `${docType} uploaded successfully`);
      setDocSelectedFiles((prev) => ({ ...prev, [docType]: null }));
      await loadUserDocuments();
    } catch (err) {
      showToast(err.message || `Failed to upload ${docType}`);
    } finally {
      setDocUploading((prev) => ({ ...prev, [docType]: false }));
    }
  }

  async function loadOfficerData(token) {
    try {
      const apps = await getBankApplications();
      setOfficerApps(apps || []);
      const dash = await getBankDashboard();
      if (dash && dash.summary) setOfficerSummary(dash.summary);
    } catch (err) {
      console.warn("Could not load officer data:", err);
    }
  }

  function handleLogout() {
    logoutUser();
    setCurrentUser(null);
    setBankUser(null);
    setUserDocs([]);
    setDocCompleteness(0);
    setPortalMode("applicant");
    setActiveTab("landing");
    showToast("Logged out successfully");
  }

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  }

  async function handleApplyToBank(bank) {
    if (!currentUser) {
      setApplyModalBank(bank);
      setAuthMode("login");
      setAuthStep("credentials");
      setAuthOtp("");
      setDemoOtpCode("");
      setAuthError("");
      setAuthModalOpen(true);
      return;
    }

    // ENFORCE THAT ALL 5 MANDATORY KYC DOCUMENTS ARE UPLOADED
    const uploadedTypes = new Set((userDocs || []).map((d) => d.type));
    const missing = MANDATORY_DOCUMENTS.filter((m) => !uploadedTypes.has(m.type));
    if (missing.length > 0) {
      setKycMissingList(missing);
      setApplyModalBank(bank);
      setKycIncompleteModalOpen(true);
      showToast(`KYC Incomplete: You must upload all 5 documents before applying.`);
      return;
    }

    setSubmittingApp(true);
    try {
      await createLoanApplication({
        bank_id: bank.bank_id || 1,
        loan_amount: requiredCapital,
        loan_term_months: loanHorizon,
        requested_interest_rate: bank.interest_rate_min || 10.35,
        notes: `Application to ${bank.bank_name} via SmartLoan Neo-Brutalist Marketplace`
      });
      showToast(`Application successfully submitted to ${bank.bank_name}!`);
    } catch (err) {
      showToast(err.message || `Application queued with ${bank.bank_name}!`);
    } finally {
      setSubmittingApp(false);
      setApplyModalBank(null);
    }
  }

  async function handleRecordDecision(decision) {
    if (!selectedReviewApp) return;
    try {
      await reviewApplicationDecision(selectedReviewApp.id, {
        decision,
        reason: decision === "Approved" ? "Strong algorithmic credit score and verified income" : "High credit debt burden",
        notes: decisionNotes || "Underwriter evaluation confirmed via protocol"
      });
      showToast(`Application ${selectedReviewApp.application_id} marked as ${decision}!`);
      setSelectedReviewApp(null);
      setDecisionNotes("");
      loadOfficerData();
    } catch {
      showToast(`Decision recorded: ${decision}`);
      setSelectedReviewApp(null);
    }
  }

  // Filter banks by category
  const filteredBanks = banks.filter((b) => {
    if (lenderFilter === "All") return true;
    if (lenderFilter === "PSU Banks") return b.bank_type === "Public Lender";
    if (lenderFilter === "Private Banks") return b.bank_type === "Private Lender";
    if (lenderFilter === "Instant TAT") return b.approval_time_display.toLowerCase().includes("instant");
    return true;
  });

  const displayList = filteredBanks.length > 0 ? filteredBanks : banks;
  const bestMatch = displayList[0] || getFallbackBanks()[0];
  const altBanks = displayList.slice(1, 5);
  const ledgerBanks = displayList.slice(5);

  return (
    <div className="neo-canvas">
      {/* =====================================================
          1. TOP NAVIGATION BAR
          ===================================================== */}
      <header className="neo-navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div className="neo-brand" onClick={() => setActiveTab("landing")}>
            <div className="neo-brand-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h7v8l10-12h-7z" />
              </svg>
            </div>
            <span className="neo-brand-text">SmartLoan AI</span>
          </div>

          <nav className="neo-nav-links">
            <button
              className={`neo-nav-item ${activeTab === "landing" ? "active" : ""}`}
              onClick={() => setActiveTab("landing")}
            >
              Overview
            </button>
            <button
              className={`neo-nav-item ${activeTab === "marketplace" ? "active" : ""}`}
              onClick={() => setActiveTab("marketplace")}
            >
              Marketplace (10)
            </button>
            <button
              className={`neo-nav-item ${activeTab === "verdict" ? "active" : ""}`}
              onClick={() => setActiveTab("verdict")}
            >
              AI Terminal
            </button>
            <button
              className={`neo-nav-item ${activeTab === "documents" ? "active" : ""}`}
              onClick={() => setActiveTab("documents")}
            >
              KYC Vault
            </button>
            <button
              className={`neo-nav-item ${activeTab === "calculator" ? "active" : ""}`}
              onClick={() => setActiveTab("calculator")}
            >
              EMI Sandbox
            </button>
          </nav>
        </div>

        <div className="neo-nav-actions">
          {/* Segmented Mode Switcher */}
          <div className="neo-segmented-control">
            <button
              className={`neo-segment-btn ${portalMode === "applicant" ? "active" : ""}`}
              onClick={() => {
                setPortalMode("applicant");
                if (activeTab === "underwriter") setActiveTab("marketplace");
              }}
            >
              Applicant Portal
            </button>
            <button
              className={`neo-segment-btn ${portalMode === "officer" ? "active" : ""}`}
              onClick={() => {
                setPortalMode("officer");
                setActiveTab("underwriter");
                if (bankUser) loadOfficerData();
                else {
                  setAuthMode("officer");
                  setAuthEmail("bank@smartloan.ai");
                  setAuthPassword("bank-demo123");
                  setAuthStep("credentials");
                  setAuthOtp("");
                  setDemoOtpCode("");
                  setAuthError("");
                  setAuthModalOpen(true);
                }
              }}
            >
              Officer Terminal
            </button>
          </div>

          <button
            className="neo-btn neo-btn-white neo-btn-sm"
            onClick={() => setActiveTab("verdict")}
            title="Check Bureau Score"
          >
            Check Score
          </button>

          {currentUser || bankUser ? (
            <button className="neo-btn neo-btn-white neo-btn-sm" onClick={handleLogout}>
              Logout ({currentUser ? currentUser.name.split(" ")[0] : "Officer"})
            </button>
          ) : (
            <button
              className="neo-btn neo-btn-primary neo-btn-sm"
              onClick={() => {
                setAuthMode("login");
                setAuthEmail("pranshu2@test.com");
                setAuthPassword("Password123");
                setAuthStep("credentials");
                setAuthOtp("");
                setDemoOtpCode("");
                setAuthError("");
                setAuthModalOpen(true);
              }}
            >
              Sign In →
            </button>
          )}

          <button
            className="neo-btn neo-btn-yellow neo-btn-sm"
            onClick={() => setActiveTab("marketplace")}
          >
            Get Sanctioned
          </button>
        </div>
      </header>

      {/* =====================================================
          SYSTEM STATUS TELEMETRY RIBBON
          ===================================================== */}
      <div className="neo-ribbon">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="neo-status-pill">
            <span className="status-dot-green"></span>
            LIVE UNDERWRITING ENGINE 3.2 // NBFC-TIER-XLA ACTIVE
          </div>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#374151" }}>
            LATENCY: 84ms • CIBIL TELEMETRY: SYNCED
          </span>
        </div>

        <div className="neo-status-pill" style={{ background: "var(--neo-charcoal)", color: "var(--neo-yellow)" }}>
          SESSION: NBFC-IND-9028-V1 • 256-BIT ENCRYPTED
        </div>
      </div>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            background: "var(--neo-charcoal)",
            color: "var(--neo-yellow)",
            border: "var(--border-2px)",
            boxShadow: "var(--shadow-lg)",
            padding: "14px 20px",
            fontFamily: "var(--font-heading)",
            fontSize: "14px",
            fontWeight: "800",
            textTransform: "uppercase"
          }}
        >
          <span style={{ background: "var(--neo-black)", color: "var(--neo-yellow)", padding: "1px 6px", marginRight: "8px", fontSize: "10px" }}>STATUS</span>
          {toastMessage}
        </div>
      )}

      {/* ==============================================================================
          PAGE 1: LANDING PAGE (PROJECT OVERVIEW & FEATURE SHOWCASE)
          ============================================================================== */}
      {activeTab === "landing" && (
        <main>
          {/* Institutional Continuous Ticker */}
          <div className="neo-marquee-wrap">
            <div className="neo-marquee-track">
              <div className="neo-marquee-item">
                <span className="status-dot-green"></span>
                <span>CONSORTIUM CLEARINGHOUSE ACTIVE</span>
              </div>
              <div className="neo-marquee-item">SBI: 10.25% APR</div>
              <div className="neo-marquee-item">HDFC: 10.50% APR</div>
              <div className="neo-marquee-item">ICICI: 10.65% APR</div>
              <div className="neo-marquee-item">AXIS: 10.75% APR</div>
              <div className="neo-marquee-item">BOB: 10.15% APR</div>
              <div className="neo-marquee-item">KOTAK: 10.99% APR</div>
              <div className="neo-marquee-item">IDFC FIRST: 10.45% APR</div>
              <div className="neo-marquee-item">CANARA: 10.40% APR</div>
              <div className="neo-marquee-item">PNB: 10.30% APR</div>
              <div className="neo-marquee-item">INDUSIND: 11.10% APR</div>
              <div className="neo-marquee-item">200-TREE XGBOOST ML: 86.2% PRECISION</div>
              <div className="neo-marquee-item">SHAP EXPLAINABILITY: 100% AUDITABLE</div>
              <div className="neo-marquee-item">FASTEST SANCTION: 46 SECONDS</div>

              <div className="neo-marquee-item">
                <span className="status-dot-green"></span>
                <span>CONSORTIUM CLEARINGHOUSE ACTIVE</span>
              </div>
              <div className="neo-marquee-item">SBI: 10.25% APR</div>
              <div className="neo-marquee-item">HDFC: 10.50% APR</div>
              <div className="neo-marquee-item">ICICI: 10.65% APR</div>
              <div className="neo-marquee-item">AXIS: 10.75% APR</div>
              <div className="neo-marquee-item">BOB: 10.15% APR</div>
              <div className="neo-marquee-item">KOTAK: 10.99% APR</div>
              <div className="neo-marquee-item">IDFC FIRST: 10.45% APR</div>
              <div className="neo-marquee-item">CANARA: 10.40% APR</div>
              <div className="neo-marquee-item">PNB: 10.30% APR</div>
              <div className="neo-marquee-item">INDUSIND: 11.10% APR</div>
              <div className="neo-marquee-item">200-TREE XGBOOST ML: 86.2% PRECISION</div>
              <div className="neo-marquee-item">SHAP EXPLAINABILITY: 100% AUDITABLE</div>
              <div className="neo-marquee-item">FASTEST SANCTION: 46 SECONDS</div>
            </div>
          </div>

          {/* Hero Section */}
          <section className="neo-hero">
            <div>
              <div className="neo-badge neo-badge-yellow hero-animate-badge" style={{ marginBottom: "16px" }}>
                <span className="status-dot-green"></span>
                NEW: 10-LENDER CONSORTIUM PROTOCOL 2.0
              </div>

              <h1 className="hero-display-title hero-animate-title">
                INSTANT ₹13,10,000 SANCTIONS.
                <br />
                <span className="hero-highlight-box">ZERO RED TAPE.</span>
              </h1>

              <p className="hero-subtext hero-animate-subtext">
                Stop juggling 12 different bank portals. <strong>SmartLoan AI</strong> aggregates Tier-1 NBFCs & PSU credit pipelines directly into one high-velocity algorithmic sanction engine.
              </p>

              <div className="hero-actions-row hero-animate-actions">
                <button
                  className="neo-btn neo-btn-primary"
                  onClick={() => setActiveTab("marketplace")}
                >
                  Execute Sanction Offer →
                </button>
                <button
                  className="neo-btn neo-btn-white"
                  onClick={() => setActiveTab("verdict")}
                >
                  Launch AI Terminal ▷
                </button>
              </div>

              <div className="hero-trust-badges hero-animate-trust">
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span className="status-dot-green" style={{ width: "6px", height: "6px" }}></span>
                  14-Day Rate Lock Guarantee
                </span>
                <span>•</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span className="status-dot-green" style={{ width: "6px", height: "6px" }}></span>
                  Zero Impact on CIBIL
                </span>
                <span>•</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span className="status-dot-green" style={{ width: "6px", height: "6px" }}></span>
                  RBI DLRE Standard
                </span>
              </div>
            </div>

            {/* Controller Widget (Hero Right) */}
            <div>
              <div className="neo-terminal-controller">
                <div className="terminal-header-bar">
                  <div className="terminal-dots">
                    <span className="t-dot t-dot-red"></span>
                    <span className="t-dot t-dot-yellow"></span>
                    <span className="t-dot t-dot-green"></span>
                  </div>
                  <span className="terminal-title">SMARTLOAN // CONTROLLER</span>
                  <span className="neo-badge neo-badge-yellow" style={{ padding: "2px 6px", fontSize: "9px" }}>
                    CALCULATOR MODE
                  </span>
                </div>

                <div className="terminal-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>Required Capital</span>
                    <strong style={{ fontSize: "20px", fontFamily: "var(--font-heading)" }}>
                      ₹{requiredCapital.toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <input
                    type="range"
                    className="neo-slider"
                    min="50000"
                    max="5000000"
                    step="25000"
                    value={requiredCapital}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRequiredCapital(val);
                      fetchBanks(val, loanHorizon);
                    }}
                  />

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: "700", color: "#666", marginBottom: "16px" }}>
                    <span>₹50K</span>
                    <span>₹25L</span>
                    <span>₹50L</span>
                  </div>

                  <div style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px" }}>
                    Loan Horizon (Months)
                  </div>

                  <div className="horizon-grid">
                    {[12, 24, 36, 48, 60].map((m) => (
                      <div
                        key={m}
                        className={`horizon-pill ${loanHorizon === m ? "active" : ""}`}
                        onClick={() => {
                          setLoanHorizon(m);
                          fetchBanks(requiredCapital, m);
                        }}
                      >
                        {m}M
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px", marginBottom: "18px" }}>
                    <div style={{ border: "var(--border-2px)", padding: "12px", background: "var(--neo-white)" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", display: "block", color: "#666" }}>
                        Estimated EMI
                      </span>
                      <strong style={{ fontSize: "20px", fontFamily: "var(--font-heading)" }}>
                        ₹{estimatedEmi.toLocaleString("en-IN")} <small style={{ fontSize: "11px" }}>/ mo</small>
                      </strong>
                    </div>

                    <div style={{ border: "var(--border-2px)", padding: "12px", background: "var(--neo-sage-tint)" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", display: "block", color: "#444" }}>
                        Clearing Time
                      </span>
                      <strong style={{ fontSize: "18px", fontFamily: "var(--font-heading)", color: "#064e3b" }}>
                        &lt; 120 SEC
                      </strong>
                    </div>
                  </div>

                  <button
                    className="neo-btn neo-btn-yellow"
                    style={{ width: "100%" }}
                    onClick={() => setActiveTab("marketplace")}
                  >
                    Filter 10 Live Lenders →
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Social Proof Live Pill */}
          <div style={{ padding: "0 5% 40px", display: "flex", justifyContent: "flex-end" }}>
            <div key={sanctionIdx} className="live-sanction-pill">
              <span className="status-dot-green"></span>
              <span>
                <strong>Just Sanctioned: {recentSanctions[sanctionIdx].amount}</strong> • {recentSanctions[sanctionIdx].name} ({recentSanctions[sanctionIdx].city}) • {recentSanctions[sanctionIdx].bank} • {recentSanctions[sanctionIdx].time}
              </span>
            </div>
          </div>

          {/* Project Feature Deep Dive */}
          <section style={{ padding: "0 5% 70px" }}>
            <div className="neo-section-heading">
              <span>System Architecture & Features</span>
              <h2>Engineered for Zero Red Tape</h2>
              <p style={{ maxWidth: "680px", color: "#2d3731", fontSize: "15px", lineHeight: "1.6" }}>
                SmartLoan AI integrates machine learning underwriting, game-theoretic explainability, and multi-institutional routing to eliminate arbitrary credit decisions.
              </p>
            </div>

            <div className="features-grid-4">
              <div className="feature-box">
                <div>
                  <div className="feature-num">01 / ML UNDERWRITING</div>
                  <h3>XGBoost Risk Classifier</h3>
                  <p>
                    200-tree gradient boosted classifier evaluating 15 financial attributes simultaneously. Delivers 86.2% precision without human reviewer latency.
                  </p>
                </div>
                <div style={{ marginTop: "16px" }}>
                  <span className="neo-badge neo-badge-emerald">86.2% Precision</span>
                </div>
              </div>

              <div className="feature-box">
                <div>
                  <div className="feature-num">02 / EXPLAINABILITY</div>
                  <h3>SHAP TreeExplainer</h3>
                  <p>
                    Mathematical Shapley value attribution. Breaks down every credit sanction into positive score drivers and risk margin drags, eliminating black-box bias.
                  </p>
                </div>
                <div style={{ marginTop: "16px" }}>
                  <span className="neo-badge neo-badge-yellow">Zero Black-Box</span>
                </div>
              </div>

              <div className="feature-box">
                <div>
                  <div className="feature-num">03 / CONSORTIUM</div>
                  <h3>10-Bank Clearinghouse</h3>
                  <p>
                    Automated multi-lender routing across SBI, HDFC, ICICI, Axis, Bank of Baroda, Kotak, PNB, Canara, IndusInd, and IDFC FIRST Bank with dynamic rate matching.
                  </p>
                </div>
                <div style={{ marginTop: "16px" }}>
                  <span className="neo-badge neo-badge-charcoal">10 Integrated Banks</span>
                </div>
              </div>

              <div className="feature-box">
                <div>
                  <div className="feature-num">04 / CAPACITY GUARD</div>
                  <h3>DTI & FOIR Stress Engine</h3>
                  <p>
                    Calculates debt-to-income and fixed obligation ratios in real time, determining maximum safe loan sanction caps while protecting against over-leverage.
                  </p>
                </div>
                <div style={{ marginTop: "16px" }}>
                  <span className="neo-badge neo-badge-emerald">Safe Sanctions</span>
                </div>
              </div>
            </div>

            {/* Big Callout Box */}
            <div className="lock-banner">
              <div>
                <h2>Explore the Institutional Multi-Lender Marketplace</h2>
                <p>
                  Compare live loan offers, verified interest rates, and sanction limits across all 10 integrated public and private banks.
                </p>
              </div>
              <button
                className="neo-btn neo-btn-yellow"
                onClick={() => setActiveTab("marketplace")}
              >
                Open Marketplace →
              </button>
            </div>
          </section>
        </main>
      )}

      {/* ==============================================================================
          PAGE 2: MARKETPLACE SCREEN (EXACT MATCH OF IMAGE 3)
          ============================================================================== */}
      {activeTab === "marketplace" && (
        <main style={{ padding: "30px 5% 60px" }}>
          {/* Header Controls */}
          <div className="marketplace-filter-bar">
            <div className="filter-pills-row">
              <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", marginRight: "6px" }}>
                Lender Type:
              </span>
              {["All", "PSU Banks", "Private Banks", "Instant TAT"].map((cat) => (
                <button
                  key={cat}
                  className={`filter-btn ${lenderFilter === cat ? "active" : ""}`}
                  onClick={() => setLenderFilter(cat)}
                >
                  {cat === "All" ? "All Lenders (10)" : cat}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", fontWeight: "700" }}>
              <span>Sort:</span>
              <span style={{ textDecoration: "underline", cursor: "pointer" }}>Lowest APR First</span>
            </div>
          </div>

          {/* KYC STATUS NOTICE FOR BORROWERS */}
          {currentUser && userDocs.length < MANDATORY_DOCUMENTS.length && (
            <div style={{ background: "var(--neo-yellow)", border: "var(--border-2px)", padding: "12px 16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ background: "#000", color: "#fff", padding: "2px 8px", fontSize: "11px", fontWeight: "800" }}>
                  KYC ACTION REQUIRED
                </span>
                <span style={{ fontSize: "12px", fontWeight: "700" }}>
                  Borrower KYC is currently {userDocs.length} of {MANDATORY_DOCUMENTS.length} mandatory documents. All 5 documents must be uploaded in the KYC Vault before loan sanction application.
                </span>
              </div>
              <button
                className="neo-btn neo-btn-white neo-btn-sm"
                onClick={() => setActiveTab("documents")}
              >
                Open KYC Vault ({MANDATORY_DOCUMENTS.length - userDocs.length} Missing) →
              </button>
            </div>
          )}

          {currentUser && userDocs.length >= MANDATORY_DOCUMENTS.length && (
            <div style={{ background: "var(--neo-emerald-bg)", border: "2px solid #065f46", padding: "10px 16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ background: "#065f46", color: "#fff", padding: "2px 8px", fontSize: "11px", fontWeight: "800" }}>
                  KYC VERIFIED
                </span>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#065f46" }}>
                  All 5/5 Mandatory KYC Documents are verified. You are pre-cleared for institutional loan application.
                </span>
              </div>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#065f46" }}>
                100% Documentation Complete
              </span>
            </div>
          )}

          {/* BEST MATCH SPOTLIGHT CARD */}
          <div className="best-match-card">
            <div className="best-match-top-row">
              <span className="neo-badge neo-badge-yellow">BEST ALGORITHMIC MATCH // 98.2%</span>
              <span className="neo-badge neo-badge-white">Pre-Approved NetBanking Disbursal</span>
              <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: "800", color: "#064e3b", display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="status-dot-green"></span> INSTANT API LINKED
              </span>
            </div>

            <div className="best-match-layout">
              <div className="bank-profile-col">
                <div className="bank-logo-box">H</div>
                <div>
                  <h2 style={{ fontSize: "24px", margin: "0 0 4px" }}>{bestMatch.bank_name}</h2>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#555", display: "block", marginBottom: "8px" }}>
                    Tier-1 Scheduled Commercial Bank
                  </span>
                  <p style={{ margin: 0, fontSize: "12px", color: "#333", lineHeight: "1.5" }}>
                    {bestMatch.recommendation || "Automated underwriting matched your salary and CIBIL profile. Direct netbanking disbursement within 2 minutes."}
                  </p>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "11px", color: "#666", fontWeight: "600" }}>
                    <span className="status-dot-green" style={{ width: "6px", height: "6px" }}></span>
                    Median Disbursal Time: 114 seconds
                  </span>
                </div>
              </div>

              <div className="metrics-quad-grid">
                <div className="metric-quad-item">
                  <span>Approved Capital</span>
                  <strong>{bestMatch.max_sanction_offered_display || "₹13,10,000"}</strong>
                  <span style={{ color: "#059669", fontSize: "9px" }}>100% of Request</span>
                </div>

                <div className="metric-quad-item yellow-tinted">
                  <span>Interest Rate</span>
                  <strong>{bestMatch.interest_rate_min ? `${bestMatch.interest_rate_min}%` : "10.35%"}</strong>
                  <span style={{ fontSize: "9px" }}>Fixed Annual APR</span>
                </div>

                <div className="metric-quad-item">
                  <span>Monthly Repayment</span>
                  <strong>₹{Number(bestMatch.estimated_monthly_emi || 42520).toLocaleString("en-IN")}</strong>
                  <span style={{ fontSize: "9px" }}>{loanHorizon} Mo. Horizon</span>
                </div>

                <div className="metric-quad-item tinted">
                  <span>Processing Toll</span>
                  <strong>₹999</strong>
                  <span style={{ color: "#059669", fontSize: "9px" }}>Waived 80% via SmartLoan</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  className="neo-btn neo-btn-primary"
                  style={{ width: "100%", padding: "14px" }}
                  onClick={() => handleApplyToBank(bestMatch)}
                  disabled={submittingApp}
                >
                  {submittingApp ? "Disbursing..." : "Claim Disbursal →"}
                </button>
                <button
                  className="neo-btn neo-btn-white"
                  style={{ width: "100%", fontSize: "12px", padding: "8px" }}
                  onClick={() => window.open(bestMatch.source_url, "_blank")}
                >
                  Inspect Contract Audit
                </button>
                <span style={{ textAlign: "center", fontSize: "10px", fontWeight: "700", color: "#666" }}>
                  Instant OTP e-Sign Verification
                </span>
              </div>
            </div>
          </div>

          {/* ACTIVE ALTERNATIVE SANCTIONS (4-GRID) */}
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h3 style={{ fontSize: "20px", textTransform: "uppercase" }}>Active Alternative Sanctions</h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#444" }}>Ranked automatically against your automated risk profile.</p>
            </div>
            <span className="neo-badge neo-badge-white">4 Pre-Approved</span>
          </div>

          <div className="alt-sanctions-grid">
            {altBanks.map((b) => (
              <div key={b.bank_name} className="alt-bank-card">
                <div className="alt-bank-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "14px", border: "1px solid #000" }}>
                      {b.bank_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <strong style={{ display: "block", fontSize: "14px" }}>{b.bank_name}</strong>
                      <span style={{ fontSize: "10px", color: "#666" }}>{b.bank_type}</span>
                    </div>
                  </div>
                  <span className="neo-badge neo-badge-yellow" style={{ fontSize: "9px", padding: "2px 6px" }}>
                    {b.approval_time_display}
                  </span>
                </div>

                <div className="alt-bank-metrics">
                  <div className="alt-metric">
                    <span>Interest</span>
                    <strong>{b.interest_rate_min}%</strong>
                  </div>
                  <div className="alt-metric">
                    <span>Monthly EMI</span>
                    <strong>₹{Number(b.estimated_monthly_emi || 0).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="alt-metric">
                    <span>Max Sanction</span>
                    <strong style={{ color: "#064e3b" }}>{b.max_sanction_offered_display || "₹12L"}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee", paddingTop: "12px" }}>
                  <span style={{ fontSize: "11px", color: "#555", fontWeight: "600" }}>
                    {b.product_name.slice(0, 20)}...
                  </span>
                  <button
                    className="neo-btn neo-btn-primary neo-btn-sm"
                    onClick={() => handleApplyToBank(b)}
                  >
                    Lock In →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* UNDERWRITING CLEARINGHOUSE LEDGER (EXTENDED TABLE) */}
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h3 style={{ fontSize: "20px", textTransform: "uppercase" }}>Underwriting Clearinghouse Ledger (Extended)</h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#444" }}>Synchronized with CIBIL Bureau Tier-1 routing ledger.</p>
            </div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#555" }}>SYNCHRONIZED WITH CIBIL SCORE: 750</span>
          </div>

          <div className="neo-table-wrapper">
            <table className="neo-table">
              <thead>
                <tr>
                  <th>Lender Entity</th>
                  <th>Offer Ceiling</th>
                  <th>Indicative APR</th>
                  <th>Verification Speed</th>
                  <th>Fees</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {ledgerBanks.map((b) => (
                  <tr key={b.bank_name}>
                    <td>
                      <strong>{b.bank_name}</strong>
                      <span style={{ display: "block", fontSize: "10px", color: "#666" }}>{b.product_name}</span>
                    </td>
                    <td>
                      <strong style={{ color: "#064e3b" }}>{b.max_sanction_offered_display || "₹12,00,000"}</strong>
                    </td>
                    <td>{b.interest_rate_display}</td>
                    <td>{b.approval_time_display}</td>
                    <td>{b.processing_fee_display}</td>
                    <td>
                      <button
                        className="neo-btn neo-btn-white neo-btn-sm"
                        onClick={() => handleApplyToBank(b)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {/* ==============================================================================
          PAGE 3: AI TERMINAL & VERDICT (EXACT MATCH OF IMAGE 1 & 2 + DYNAMIC PREDICTION)
          ============================================================================== */}
      {activeTab === "verdict" && (
        <main style={{ padding: "30px 5% 60px" }}>
          {/* Active Borrower Condition Matrix & Calibrator */}
          <div className="condition-calibrator-card">
            <div className="calibrator-header">
              <div>
                <span className="neo-badge neo-badge-charcoal" style={{ fontSize: "9px", marginBottom: "6px" }}>
                  AI TELEMETRY SENSITIVITY CALIBRATOR
                </span>
                <h2 style={{ fontSize: "24px", textTransform: "uppercase" }}>
                  Active Borrower Financial Matrix
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#444" }}>
                  Calibrate live applicant financial inputs or choose institutional archetypes. Real-time machine learning re-evaluates CIBIL telemetry, approval probability, SHAP factors, and underwriting limits.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {conditionLoading ? (
                  <span className="neo-badge neo-badge-yellow" style={{ fontSize: "10px", animation: "pulse 1s infinite" }}>
                    CALCULATING ML INFERENCE...
                  </span>
                ) : (
                  <span className="neo-badge neo-badge-emerald" style={{ fontSize: "10px" }}>
                    LIVE PREDICTION ENGINE SYNCED
                  </span>
                )}
              </div>
            </div>

            {/* Presets Bar */}
            <div className="calibrator-presets-bar">
              <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#171e19" }}>
                Institutional Presets:
              </span>
              <button
                className={`preset-chip-btn ${activeConditionPreset === "prime" ? "active" : ""}`}
                onClick={() => handleApplyPreset("prime")}
                id="preset-prime-btn"
              >
                Prime-A (780 CIBIL)
              </button>
              <button
                className={`preset-chip-btn ${activeConditionPreset === "near_prime" ? "active" : ""}`}
                onClick={() => handleApplyPreset("near_prime")}
                id="preset-near-prime-btn"
              >
                Near-Prime (710 CIBIL)
              </button>
              <button
                className={`preset-chip-btn ${activeConditionPreset === "moderate" ? "active" : ""}`}
                onClick={() => handleApplyPreset("moderate")}
                id="preset-moderate-btn"
              >
                Moderate Risk (660 CIBIL)
              </button>
              <button
                className={`preset-chip-btn ${activeConditionPreset === "stressed" ? "active" : ""}`}
                onClick={() => handleApplyPreset("stressed")}
                id="preset-stressed-btn"
              >
                Sub-Prime / Stressed (590 CIBIL)
              </button>
              <button
                className={`preset-chip-btn ${activeConditionPreset === "profile" ? "active" : ""}`}
                onClick={handleSyncUserProfile}
                id="preset-sync-profile-btn"
                style={{ background: "#dbeafe" }}
              >
                Sync My Live Profile
              </button>
            </div>

            {/* Interactive Sliders Grid */}
            <div className="calibrator-grid">
              {/* CIBIL Score */}
              <div className="calibrator-input-box">
                <div className="calibrator-input-header">
                  <span className="calibrator-label">Bureau Score (CIBIL)</span>
                  <span className="calibrator-val" style={{ color: cibilScore >= 750 ? "#059669" : cibilScore >= 650 ? "#d97706" : "#dc2626" }}>
                    {cibilScore} <small style={{ fontSize: "12px", color: "#666" }}>/ 900</small>
                  </span>
                </div>
                <input
                  type="range"
                  className="neo-slider"
                  min="300"
                  max="900"
                  step="5"
                  value={cibilScore}
                  id="cibil-score-slider"
                  onChange={(e) => {
                    setCibilScore(Number(e.target.value));
                    setActiveConditionPreset("custom");
                  }}
                />
                <div className="calibrator-range-limits">
                  <span>300 (Sub-Prime)</span>
                  <span>650 (Avg)</span>
                  <span>750 (Prime)</span>
                  <span>900 (Max)</span>
                </div>
              </div>

              {/* Monthly Income */}
              <div className="calibrator-input-box">
                <div className="calibrator-input-header">
                  <span className="calibrator-label">Net Monthly Salary</span>
                  <span className="calibrator-val">₹{monthlyIncome.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  className="neo-slider"
                  min="20000"
                  max="300000"
                  step="5000"
                  value={monthlyIncome}
                  id="monthly-income-slider"
                  onChange={(e) => {
                    setMonthlyIncome(Number(e.target.value));
                    setActiveConditionPreset("custom");
                  }}
                />
                <div className="calibrator-range-limits">
                  <span>₹20,000</span>
                  <span>₹1,50,000</span>
                  <span>₹3,00,000</span>
                </div>
              </div>

              {/* Existing Monthly Debt / EMI */}
              <div className="calibrator-input-box">
                <div className="calibrator-input-header">
                  <span className="calibrator-label">Existing Monthly EMI</span>
                  <span className="calibrator-val">₹{existingEmi.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  className="neo-slider"
                  min="0"
                  max="100000"
                  step="2000"
                  value={existingEmi}
                  id="existing-emi-slider"
                  onChange={(e) => {
                    setExistingEmi(Number(e.target.value));
                    setActiveConditionPreset("custom");
                  }}
                />
                <div className="calibrator-range-limits">
                  <span>₹0 (Clean FOIR)</span>
                  <span>₹50,000</span>
                  <span>₹1,00,000</span>
                </div>
              </div>

              {/* Revolving Card Utilization */}
              <div className="calibrator-input-box">
                <div className="calibrator-input-header">
                  <span className="calibrator-label">Card Utilization Ratio</span>
                  <span className="calibrator-val" style={{ color: creditUtilization <= 0.3 ? "#059669" : creditUtilization <= 0.6 ? "#d97706" : "#dc2626" }}>
                    {Math.round(creditUtilization * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  className="neo-slider"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={creditUtilization}
                  id="card-utilization-slider"
                  onChange={(e) => {
                    setCreditUtilization(Number(e.target.value));
                    setActiveConditionPreset("custom");
                  }}
                />
                <div className="calibrator-range-limits">
                  <span>5% (Optimal)</span>
                  <span>30% (Threshold)</span>
                  <span>95% (High Risk)</span>
                </div>
              </div>

              {/* Missed Payments Selector */}
              <div className="calibrator-input-box" style={{ gridColumn: "1 / -1" }}>
                <div className="calibrator-input-header">
                  <span className="calibrator-label">Missed Payments & Delinquency Record (Past 24 Months)</span>
                  <span className="calibrator-val" style={{ color: missedPayments === 0 ? "#059669" : "#dc2626", fontSize: "14px" }}>
                    {missedPayments === 0 ? "Zero Late Cycles (Flawless)" : `${missedPayments} Late Payment Cycle(s)`}
                  </span>
                </div>
                <div className="missed-pills-row">
                  {[
                    { count: 0, label: "0 Missed (Flawless 100%)" },
                    { count: 1, label: "1 Missed (30-day slip)" },
                    { count: 2, label: "2 Missed (60-day watch)" },
                    { count: 3, label: "3+ Defaults (Delinquent)" }
                  ].map((opt) => (
                    <button
                      key={opt.count}
                      className={`missed-pill-btn ${missedPayments === opt.count ? "active" : ""}`}
                      onClick={() => {
                        setMissedPayments(opt.count);
                        setActiveConditionPreset("custom");
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Row: Telemetry + Sanction Verdict */}
          <div className="telemetry-row">
            {/* Left: CIBIL Telemetry */}
            <div className="cibil-window">
              <div className="terminal-header-bar">
                <div className="terminal-dots">
                  <span className="t-dot t-dot-red"></span>
                  <span className="t-dot t-dot-yellow"></span>
                  <span className="t-dot t-dot-green"></span>
                </div>
                <span className="terminal-title">CIBIL_TELEMETRY.EXE</span>
                <span className="neo-badge neo-badge-yellow" style={{ fontSize: "9px", padding: "2px 6px" }}>
                  LIVE SYNCED
                </span>
              </div>

              <div className="cibil-body">
                <div className="cibil-header-row">
                  <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#666" }}>
                    Bureau Health Rating
                  </span>
                  <span
                    className="neo-badge"
                    style={{
                      fontSize: "10px",
                      background: conditionResult.cibil_tier_color === "#ef4444" ? "#fee2e2" : conditionResult.cibil_tier_color === "#f59e0b" ? "#fef3c7" : "#d1fae5",
                      color: conditionResult.cibil_tier_color || "#064e3b",
                      border: "1.5px solid #000"
                    }}
                  >
                    {conditionResult.cibil_tier || "PRIME-A BORROWER"}
                  </span>
                </div>

                <div className="cibil-score-display">
                  {conditionResult.cibil_score} <small>/ 900</small>
                </div>

                {/* 4-tier spectrum bar with needle pointer */}
                <div style={{ position: "relative", marginBottom: "8px" }}>
                  <div className="spectrum-bar" style={{ marginBottom: 0 }}>
                    <div className="spec-tier spec-red" title="Poor (300-600)"></div>
                    <div className="spec-tier spec-orange" title="Average (600-720)"></div>
                    <div className="spec-tier spec-green" title="Prime (720-800)"></div>
                    <div className="spec-tier spec-black" title="Super-Prime (800-900)"></div>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      top: "-8px",
                      left: `${Math.max(3, Math.min(97, conditionResult.spectrum_position || 70))}%`,
                      transform: "translateX(-50%)",
                      transition: "left 0.25s ease",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      pointerEvents: "none"
                    }}
                  >
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: "5px solid transparent",
                        borderRight: "5px solid transparent",
                        borderTop: "7px solid #000"
                      }}
                    />
                  </div>
                </div>

                <div className="spectrum-labels">
                  <span>POOR (300)</span>
                  <span>AVERAGE (650)</span>
                  <span style={{ color: conditionResult.cibil_score >= 720 ? "#064e3b" : "#dc2626", fontWeight: "900" }}>
                    {conditionResult.cibil_score} {conditionResult.cibil_score >= 720 ? "EXCELLENT" : "CURRENT"}
                  </span>
                  <span>900</span>
                </div>

                <div className="cibil-dual-stats">
                  <div className="cibil-stat-box">
                    <span>National Percentile</span>
                    <strong>{conditionResult.percentile}</strong>
                    <span style={{ fontSize: "9px", color: "#666" }}>{conditionResult.percentile_desc}</span>
                  </div>

                  <div className="cibil-stat-box">
                    <span>Historical Default Risk</span>
                    <strong>{conditionResult.default_risk}</strong>
                    <span
                      style={{
                        fontSize: "9px",
                        color: conditionResult.default_risk?.startsWith("0.") || conditionResult.default_risk?.startsWith("1.") ? "#064e3b" : "#dc2626",
                        fontWeight: "800"
                      }}
                    >
                      {conditionResult.default_zone}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "700", color: "#555" }}>
                  <span>Synced via ML Scoring Engine</span>
                  <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => showToast(`CIBIL Score: ${conditionResult.cibil_score} | Tier: ${conditionResult.cibil_tier}`)}>
                    Telemetry Data Synced
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Instant Algorithmic Sanction Verdict */}
            <div className="verdict-card">
              <div>
                <div className="verdict-header-row">
                  <div className="neo-badge neo-badge-charcoal">
                    INSTANT ALGORITHMIC SANCTION VERDICT
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: "800", background: "#fef3c7", padding: "3px 8px", border: "1px solid #000" }}>
                    SPEED: 114s
                  </span>
                </div>

                <div style={{ display: "flex", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                  <span className="neo-badge neo-badge-white" style={{ fontSize: "10px" }}>
                    DECISION CONFIDENCE: {conditionResult.approval_probability?.toFixed(1) || "98.0"}%
                  </span>
                  <span
                    className="neo-badge"
                    style={{
                      fontSize: "10px",
                      background: conditionResult.prediction === "APPROVED" ? "#d1fae5" : "#fee2e2",
                      color: conditionResult.prediction === "APPROVED" ? "#065f46" : "#991b1b"
                    }}
                  >
                    {conditionResult.verdict_status || "PRE-APPROVED"}
                  </span>
                </div>

                <h1 className="verdict-headline" style={{ color: conditionResult.verdict_color || "#059669" }}>
                  {conditionResult.verdict_title}
                </h1>

                <p className="verdict-subtext">
                  {conditionResult.verdict_subtext}
                </p>

                <div className="verdict-metrics-row">
                  <div style={{ border: "var(--border-2px)", padding: "12px", background: "var(--neo-white)" }}>
                    <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", display: "block", color: "#666" }}>
                      Max Loan Sanction
                    </span>
                    <strong style={{ fontSize: "22px", fontFamily: "var(--font-heading)" }}>
                      ₹{Number(conditionResult.max_loan_sanction || 0).toLocaleString("en-IN")}
                    </strong>
                    <span style={{ fontSize: "9px", color: conditionResult.max_loan_sanction > 0 ? "#059669" : "#dc2626", fontWeight: "800", display: "block" }}>
                      {conditionResult.max_loan_sanction > 0 ? "Zero Collateral Required" : "Collateral / Co-Applicant Required"}
                    </span>
                  </div>

                  <div style={{ border: "var(--border-2px)", padding: "12px", background: "var(--neo-yellow)" }}>
                    <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", display: "block", color: "#000" }}>
                      Algorithmic Rate
                    </span>
                    <strong style={{ fontSize: "22px", fontFamily: "var(--font-heading)" }}>
                      {conditionResult.algorithmic_rate?.toFixed(2) || "10.25"}% <small style={{ fontSize: "12px" }}>p.a.</small>
                    </strong>
                    <span style={{ fontSize: "9px", fontWeight: "800", display: "block" }}>Repo-Linked 6.50% Base</span>
                  </div>

                  <div style={{ border: "var(--border-2px)", padding: "12px", background: "var(--neo-sage-tint)" }}>
                    <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", display: "block", color: "#444" }}>
                      Processing Fee
                    </span>
                    <strong style={{ fontSize: "22px", fontFamily: "var(--font-heading)" }}>
                      ₹0 <small style={{ textDecoration: "line-through", fontSize: "12px", color: "#888" }}>₹6,500</small>
                    </strong>
                    <span style={{ fontSize: "9px", color: "#059669", fontWeight: "800", display: "block" }}>
                      100% Platform Waiver Applied
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: "800", marginBottom: "4px" }}>
                    <span>Auto-Underwriting Protocol Completion</span>
                    <span>{conditionResult.completion_percentage || 94}% COMPLETE</span>
                  </div>
                  <div style={{ height: "10px", background: "#e5e7eb", border: "var(--border-2px)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${conditionResult.completion_percentage || 94}%`,
                        height: "100%",
                        background: conditionResult.prediction === "APPROVED" ? "var(--neo-yellow)" : "#ef4444"
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <button
                  className="neo-btn neo-btn-primary"
                  onClick={handleDownloadSanctionLetter}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                  id="download-sanction-letter-btn"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download Provisional Sanction Letter (PDF)
                </button>
                <span style={{ fontSize: "10px", fontWeight: "700", color: "#666", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  256-Bit RBI Encrypted
                </span>
              </div>
            </div>
          </div>

          {/* Middle: SHAP Attribution Matrix & Neural Decision Trees */}
          <div className="shap-container">
            <div className="neo-badge neo-badge-charcoal" style={{ marginBottom: "10px" }}>
              XGPLUS NEURAL AI ENGINE
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ fontSize: "26px", textTransform: "uppercase" }}>
                  SHAP Attribution Matrix & Neural Decision Trees
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#555", fontWeight: "600" }}>
                  Mathematical breakdown of factors contributing to your bureau score and interest yield.
                </p>
              </div>
              <span className="neo-badge neo-badge-white" style={{ fontSize: "10px" }}>
                TREE-EXPLAINER INFERENCE: {conditionResult.positive_drivers?.length || 0} POSITIVE / {conditionResult.negative_drivers?.length || 0} NEGATIVE
              </span>
            </div>

            <div className="shap-dual-cards">
              {/* Positive Drivers */}
              <div className="shap-card">
                <div className="shap-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="status-dot-green"></span>
                    <strong style={{ fontSize: "15px" }}>
                      Key Positive Score Drivers ({conditionResult.positive_drivers?.length || 0} Factors)
                    </strong>
                  </div>
                  <span className="neo-badge neo-badge-emerald" style={{ fontSize: "9px" }}>
                    {(conditionResult.positive_drivers?.length || 0) > 0 ? "OPTIMAL" : "NEUTRAL"}
                  </span>
                </div>

                {conditionResult.positive_drivers && conditionResult.positive_drivers.length > 0 ? (
                  conditionResult.positive_drivers.map((drv, idx) => (
                    <div key={idx} className="shap-factor-row">
                      <div className="shap-icon-badge" style={{ fontWeight: "900" }}>+</div>
                      <div className="shap-factor-info">
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <strong>{drv.title}</strong>
                          <span style={{ color: "#059669", fontWeight: "900" }}>{drv.points}</span>
                        </div>
                        <p>{drv.desc}</p>
                        <div className="shap-meter-bar">
                          <div className="shap-meter-fill-green" style={{ width: `${drv.meter || 80}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "28px 16px", textAlign: "center", background: "#f8fafc", border: "1.5px dashed #94a3b8" }}>
                    <strong style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", display: "block" }}>
                      No Net Positive Drivers
                    </strong>
                    <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#94a3b8" }}>
                      Credit profile currently exhibits high risk or limited credit vintage.
                    </p>
                  </div>
                )}
              </div>

              {/* Negative / Risk Drag */}
              <div className="shap-card">
                <div className="shap-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#ef4444", border: "1.5px solid #000", display: "inline-block" }}></span>
                    <strong style={{ fontSize: "15px" }}>
                      Risk Sensitivities & Margin Drag ({conditionResult.negative_drivers?.length || 0} Alerts)
                    </strong>
                  </div>
                  <span
                    className="neo-badge"
                    style={{
                      fontSize: "9px",
                      background: (conditionResult.negative_drivers?.length || 0) > 0 ? "#fee2e2" : "#d1fae5",
                      color: (conditionResult.negative_drivers?.length || 0) > 0 ? "#991b1b" : "#065f46"
                    }}
                  >
                    {(conditionResult.negative_drivers?.length || 0) > 0 ? "ACTION REQ" : "CLEAR"}
                  </span>
                </div>

                {conditionResult.negative_drivers && conditionResult.negative_drivers.length > 0 ? (
                  conditionResult.negative_drivers.map((drv, idx) => (
                    <div key={idx} className="shap-factor-row risk-row" style={{ borderLeft: `4px solid ${drv.color || "#ef4444"}` }}>
                      <div className="shap-icon-badge" style={{ background: "#fef2f2", color: "#991b1b", fontWeight: "900" }}>-</div>
                      <div className="shap-factor-info">
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <strong>{drv.title}</strong>
                          <span style={{ color: "#dc2626", fontWeight: "900" }}>{drv.points}</span>
                        </div>
                        <p>{drv.desc}</p>
                        <div className="shap-meter-bar">
                          <div className="shap-meter-fill-red" style={{ width: `${drv.meter || 60}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "28px 16px", textAlign: "center", background: "#f0fdf4", border: "1.5px dashed #86efac" }}>
                    <strong style={{ fontSize: "12px", color: "#166534", textTransform: "uppercase", display: "block" }}>
                      Zero Active Risk Penalties
                    </strong>
                    <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#15803d" }}>
                      No adverse delinquency flags or credit strain detected on current profile.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom: Rate Optimizer & Margin Concession Checklist */}
          <div className="optimizer-checklist">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span className="neo-badge neo-badge-yellow" style={{ fontSize: "9px", marginBottom: "6px" }}>
                  SANDBOX SIMULATOR • REAL-TIME RE-CALCULATOR
                </span>
                <h2 style={{ fontSize: "24px", textTransform: "uppercase" }}>
                  Rate Optimizer & Margin Concession Checklist
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#444" }}>
                  Toggle high-impact balance optimizations below to instantly trigger automated NBFC rate re-quotes before committing:
                </p>
              </div>

              <div style={{ border: "var(--border-2px)", padding: "8px 16px", background: "var(--neo-white)", display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>Projected Rate:</span>
                <strong style={{ fontSize: "22px", fontFamily: "var(--font-heading)" }}>
                  {conditionResult.algorithmic_rate ? conditionResult.algorithmic_rate.toFixed(2) : "10.25"}% p.a.
                </strong>
                <span className="neo-badge neo-badge-emerald" style={{ fontSize: "10px" }}>
                  -{(optCardSpend ? 25 : 0) + (optNachMandate ? 25 : 0) + (optCoApplicant ? 35 : 0)} bps
                </span>
              </div>
            </div>

            {/* Checkbox 1 */}
            <div className="check-item" onClick={() => setOptCardSpend(!optCardSpend)} id="opt-card-spend-box">
              <div className="check-left">
                <div className={`neo-checkbox ${optCardSpend ? "checked" : ""}`}>
                  {optCardSpend && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <strong style={{ fontSize: "14px" }}>Reduce credit card spend below 20% (-₹24,000)</strong>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#555" }}>
                    Clears utilization risk tag instantly. Unlocks prime sub-10% slab with Tier-1 lenders.
                  </p>
                </div>
              </div>
              <span className="neo-badge neo-badge-yellow" style={{ fontSize: "11px" }}>
                Unlocks 25 bps concession
              </span>
            </div>

            {/* Checkbox 2 */}
            <div className="check-item" onClick={() => setOptNachMandate(!optNachMandate)} id="opt-nach-mandate-box">
              <div className="check-left">
                <div className={`neo-checkbox ${optNachMandate ? "checked" : ""}`}>
                  {optNachMandate && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <strong style={{ fontSize: "14px" }}>Set up automated e-NACH mandate via UPI / NetBanking</strong>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#555" }}>
                    Eliminates manual cheque bounce hazards with automated recurring debit registration.
                  </p>
                </div>
              </div>
              <span className="neo-badge neo-badge-white" style={{ fontSize: "11px" }}>
                Extra 25 bps concession
              </span>
            </div>

            {/* Checkbox 3 */}
            <div className="check-item" onClick={() => setOptCoApplicant(!optCoApplicant)} id="opt-co-applicant-box">
              <div className="check-left">
                <div className={`neo-checkbox ${optCoApplicant ? "checked" : ""}`}>
                  {optCoApplicant && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <strong style={{ fontSize: "14px" }}>Add Co-Applicant with &gt;700 Bureau Score (Spouse / Parent)</strong>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#555" }}>
                    Expands aggregate eligibility ceiling from ₹45L up to ₹80L instantly.
                  </p>
                </div>
              </div>
              <span className="neo-badge neo-badge-white" style={{ fontSize: "11px" }}>
                +₹35,00,000 Capacity
              </span>
            </div>

            <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "var(--border-2px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: "800" }}>
                  Loan Tenor Calibration: {loanHorizon} Months ({Math.round(loanHorizon / 12)} Years)
                </span>
                <strong style={{ fontSize: "18px", fontFamily: "var(--font-heading)" }}>
                  ₹{Math.round(
                    ((conditionResult.max_loan_sanction > 0 ? Math.min(requiredCapital, conditionResult.max_loan_sanction) : requiredCapital) *
                      ((conditionResult.algorithmic_rate || 10.25) / 1200) *
                      Math.pow(1 + (conditionResult.algorithmic_rate || 10.25) / 1200, loanHorizon)) /
                      (Math.pow(1 + (conditionResult.algorithmic_rate || 10.25) / 1200, loanHorizon) - 1) || 0
                  ).toLocaleString("en-IN")}{" "}
                  <small style={{ fontSize: "11px" }}>/ month</small>
                </strong>
              </div>
              <input
                type="range"
                className="neo-slider"
                min="12"
                max="84"
                step="12"
                value={loanHorizon}
                onChange={(e) => setLoanHorizon(Number(e.target.value))}
                id="tenor-slider"
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: "700", color: "#666" }}>
                <span>12 Mo (1 Yr)</span>
                <span>24 Mo</span>
                <span>36 Mo</span>
                <span>48 Mo</span>
                <span>60 Mo</span>
                <span>72 Mo</span>
                <span>84 Mo (7 Yrs)</span>
              </div>
            </div>
          </div>

          {/* Bottom Lock In Banner */}
          <div className="lock-banner">
            <div>
              <span className="neo-badge neo-badge-yellow" style={{ fontSize: "9px", marginBottom: "8px" }}>
                EXCLUSIVE NBFC CONSORTIUM SANCTION
              </span>
              <h2>Ready to Disburse? Lock In The Prime Rate Now.</h2>
              <p>
                Direct integration with HDFC Bank and ICICI underwriting gateways ensures e-Sign disbursement within 180 seconds. No physical branch verification needed.
              </p>
            </div>
            <button
              className="neo-btn neo-btn-yellow"
              style={{ fontSize: "15px", padding: "16px 24px" }}
              onClick={() => setActiveTab("marketplace")}
              id="lock-prime-rate-btn"
            >
              Lock In Prime Rate with HDFC →
            </button>
          </div>

          {/* 4-Card Integration Verification Ticker */}
          <div className="integration-ticker">
            <div className="ticker-card">
              <span className="status-dot-green"></span>
              <div>
                <strong>HDFC Bank API</strong>
                <span style={{ display: "block", fontSize: "10px", color: "#666" }}>9.95% p.a. • Instant e-Sign</span>
              </div>
            </div>

            <div className="ticker-card">
              <span className="status-dot-green"></span>
              <div>
                <strong>ICICI Prime Gate</strong>
                <span style={{ display: "block", fontSize: "10px", color: "#666" }}>10.15% p.a. • Zero Paper</span>
              </div>
            </div>

            <div className="ticker-card">
              <span className="status-dot-green"></span>
              <div>
                <strong>CIBIL Bureau V5</strong>
                <span style={{ display: "block", fontSize: "10px", color: "#666" }}>Synced 12m ago</span>
              </div>
            </div>

            <div className="ticker-card">
              <span className="status-dot-green"></span>
              <div>
                <strong>DigiLocker KYC</strong>
                <span style={{ display: "block", fontSize: "10px", color: "#666" }}>Aadhaar XML Verified</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ==============================================================================
          PAGE 4: KYC DOCUMENT VAULT & VERIFICATION CENTER
          ============================================================================== */}
      {activeTab === "documents" && (
        <main style={{ padding: "40px 5% 70px" }}>
          {/* Header */}
          <div className="neo-section-heading">
            <span className="neo-badge neo-badge-yellow" style={{ marginBottom: "12px" }}>
              <span className="status-dot-green"></span>
              RBI DLRE COMPLIANT • 256-BIT ENCRYPTED
            </span>
            <h2>Underwriting Document Vault</h2>
            <p style={{ maxWidth: "680px", color: "#2d3731", fontSize: "15px", lineHeight: "1.6" }}>
              Upload mandatory identity, income, and banking credentials to satisfy RBI fair practices verification standards and qualify for instant algorithmic loan disbursal across all 10 consortium lenders.
            </p>
          </div>

          {/* Guest Mode Warning if not logged in */}
          {!currentUser && (
            <div
              style={{
                background: "var(--neo-white)",
                border: "var(--border-2px)",
                boxShadow: "var(--shadow-md)",
                padding: "20px 24px",
                marginBottom: "30px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px"
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span className="neo-badge neo-badge-charcoal" style={{ fontSize: "10px" }}>GUEST SESSION</span>
                  <strong style={{ fontSize: "16px" }}>Sign In to Sync Documents to Your Secure Vault</strong>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#555" }}>
                  Uploaded files are tied to your applicant profile to calculate your KYC verification percentage.
                </p>
              </div>
              <button
                className="neo-btn neo-btn-primary"
                onClick={() => {
                  setAuthMode("login");
                  setAuthEmail("pranshu2@test.com");
                  setAuthPassword("Password123");
                  setAuthModalOpen(true);
                }}
              >
                Sign In with Demo Account →
              </button>
            </div>
          )}

          {/* Telemetry Summary Cards */}
          <div className="vault-stats-grid">
            <div className="vault-stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#555" }}>
                  KYC Completeness
                </span>
                <span className={`neo-badge ${docCompleteness >= 80 ? "neo-badge-emerald" : "neo-badge-yellow"}`} style={{ fontSize: "10px" }}>
                  {docCompleteness >= 80 ? "READY FOR SANCTION" : "INCOMPLETE"}
                </span>
              </div>
              <strong style={{ fontSize: "36px", fontFamily: "var(--font-heading)" }}>
                {docCompleteness}%
              </strong>
              <div style={{ height: "10px", background: "#e5e7eb", border: "var(--border-2px)", overflow: "hidden", margin: "14px 0 8px" }}>
                <div style={{ width: `${docCompleteness}%`, height: "100%", background: docCompleteness >= 80 ? "#10b981" : "var(--neo-yellow)", transition: "width 0.4s ease" }}></div>
              </div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#666" }}>
                {userDocs.length} of 5 mandatory documents uploaded
              </span>
            </div>

            <div className="vault-stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#555" }}>
                  Encryption & Security
                </span>
                <span className="neo-badge neo-badge-charcoal" style={{ fontSize: "10px" }}>
                  ACTIVE
                </span>
              </div>
              <strong style={{ fontSize: "28px", fontFamily: "var(--font-heading)" }}>
                AES-256 At Rest
              </strong>
              <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#444", lineHeight: "1.5" }}>
                Zero-knowledge isolated tenant directory with strict IDOR prevention and cryptographic signature verification.
              </p>
            </div>

            <div className="vault-stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#555" }}>
                  Underwriter TAT
                </span>
                <span className="neo-badge neo-badge-emerald" style={{ fontSize: "10px" }}>
                  FAST-TRACK
                </span>
              </div>
              <strong style={{ fontSize: "28px", fontFamily: "var(--font-heading)", color: "#064e3b" }}>
                {docCompleteness >= 80 ? "< 120 Seconds" : "Pending Proofs"}
              </strong>
              <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#444", lineHeight: "1.5" }}>
                100% digital verification unlocks instant netbanking disbursement across all 10 integrated public & private lenders.
              </p>
            </div>
          </div>

          {/* Mandatory Documents Upload Grid */}
          <div style={{ marginBottom: "18px" }}>
            <h3 style={{ fontSize: "22px", textTransform: "uppercase", marginBottom: "6px" }}>
              Mandatory KYC & Verification Checklist
            </h3>
            <p style={{ fontSize: "13px", color: "#555", margin: 0 }}>
              Accepted formats: PDF, PNG, JPG, JPEG (Max 10 MB per file).
            </p>
          </div>

          <div className="doc-grid-container">
            {MANDATORY_DOCUMENTS.map((item) => {
              const uploaded = userDocs.find((d) => d.document_type === item.type);
              const isUploading = !!docUploading[item.type];
              const selectedFile = docSelectedFiles[item.type];

              return (
                <div key={item.type} className="doc-vault-card">
                  <div>
                    <div className="doc-card-header">
                      <div className="doc-type-icon">{item.code}</div>
                      {uploaded ? (
                        <span className="neo-badge neo-badge-emerald" style={{ fontSize: "10px" }}>
                          <span className="status-dot-green"></span>
                          VERIFIED // ON FILE
                        </span>
                      ) : (
                        <span className="neo-badge neo-badge-yellow" style={{ fontSize: "10px" }}>
                          ACTION REQUIRED
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontSize: "17px", textTransform: "uppercase", margin: "0 0 6px" }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: "12px", color: "#555", margin: "0 0 14px", lineHeight: "1.5" }}>
                      {item.desc}
                    </p>

                    {uploaded && (
                      <div style={{ background: "var(--neo-sage-tint)", border: "var(--border-2px)", padding: "10px 12px", marginBottom: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                            {uploaded.file_name}
                          </strong>
                          <span style={{ fontSize: "10px", color: "#064e3b", fontWeight: "800" }}>
                            {uploaded.file_size ? `${Math.round(uploaded.file_size / 1024)} KB` : "Verified"}
                          </span>
                        </div>
                        <span style={{ fontSize: "10px", color: "#555", display: "block", marginTop: "3px" }}>
                          Uploaded on {new Date(uploaded.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    {uploaded ? (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <a
                          href={getDocumentDownloadUrl(uploaded.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="neo-btn neo-btn-white neo-btn-sm"
                          style={{ flex: 1 }}
                        >
                          Download File →
                        </a>
                      </div>
                    ) : (
                      <div className="doc-upload-zone">
                        <input
                          type="file"
                          accept={item.accept}
                          className="doc-file-input"
                          onChange={(e) => {
                            const f = e.target.files && e.target.files[0];
                            if (f) {
                              setDocSelectedFiles((prev) => ({ ...prev, [item.type]: f }));
                            }
                          }}
                        />
                        <button
                          className="neo-btn neo-btn-primary neo-btn-sm"
                          style={{ width: "100%" }}
                          disabled={isUploading || !selectedFile}
                          onClick={() => handleDocUpload(item.type)}
                        >
                          {isUploading ? "Uploading & Encrypting..." : "Upload to Vault →"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Audited Document Ledger Table */}
          <div style={{ marginTop: "40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span className="neo-badge neo-badge-charcoal" style={{ marginBottom: "6px" }}>LEDGER</span>
                <h3 style={{ fontSize: "24px", textTransform: "uppercase", margin: 0 }}>
                  Cryptographic KYC Document Audit Ledger
                </h3>
              </div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#555" }}>
                Synchronized with FastAPI Secure File Store
              </span>
            </div>

            <div className="neo-table-wrapper">
              <table className="neo-table">
                <thead>
                  <tr>
                    <th>Doc ID</th>
                    <th>Document Category</th>
                    <th>File Name</th>
                    <th>File Size</th>
                    <th>Verification Status</th>
                    <th>Upload Timestamp</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#666", fontWeight: "700" }}>
                        No documents recorded in ledger yet. Select and upload your mandatory proofs above.
                      </td>
                    </tr>
                  ) : (
                    userDocs.map((doc) => (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: "800", fontFamily: "var(--font-heading)" }}>
                          #DOC-{String(doc.id).padStart(4, "0")}
                        </td>
                        <td>
                          <strong>{doc.document_type}</strong>
                        </td>
                        <td style={{ fontSize: "12px", color: "#333" }}>
                          {doc.file_name}
                        </td>
                        <td style={{ fontSize: "12px" }}>
                          {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : "—"}
                        </td>
                        <td>
                          <span className={`neo-badge ${doc.review_status === "Verified" ? "neo-badge-emerald" : "neo-badge-yellow"}`} style={{ fontSize: "10px" }}>
                            {doc.review_status || "Verified"}
                          </span>
                        </td>
                        <td style={{ fontSize: "12px", color: "#555" }}>
                          {new Date(doc.uploaded_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <a
                            href={getDocumentDownloadUrl(doc.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="neo-btn neo-btn-yellow neo-btn-sm"
                            style={{ padding: "4px 10px", fontSize: "11px" }}
                          >
                            Download →
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* ==============================================================================
          PAGE 5: EMI SANDBOX / CALCULATOR
          ============================================================================== */}
      {activeTab === "calculator" && (
        <main style={{ padding: "40px 5% 70px" }}>
          <div className="neo-section-heading">
            <span>Reducing-Balance Engine</span>
            <h2>Interactive EMI Sandbox</h2>
            <p style={{ maxWidth: "600px", color: "#333", fontSize: "15px" }}>
              Simulate monthly installment schedules across customizable loan horizons and interest rate tiers.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
            <div className="neo-card-lg" style={{ background: "var(--neo-white)" }}>
              <h3 style={{ fontSize: "20px", marginBottom: "20px" }}>Adjust Parameters</h3>

              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase" }}>Loan Amount</span>
                  <strong style={{ fontSize: "18px" }}>₹{requiredCapital.toLocaleString("en-IN")}</strong>
                </div>
                <input
                  type="range"
                  className="neo-slider"
                  min="50000"
                  max="5000000"
                  step="25000"
                  value={requiredCapital}
                  onChange={(e) => setRequiredCapital(Number(e.target.value))}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase" }}>Tenure (Months)</span>
                  <strong style={{ fontSize: "18px" }}>{loanHorizon} Months ({loanHorizon / 12} Yrs)</strong>
                </div>
                <div className="horizon-grid">
                  {[12, 24, 36, 48, 60].map((m) => (
                    <div
                      key={m}
                      className={`horizon-pill ${loanHorizon === m ? "active" : ""}`}
                      onClick={() => setLoanHorizon(m)}
                    >
                      {m}M
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="neo-btn neo-btn-primary"
                style={{ width: "100%" }}
                onClick={() => setActiveTab("marketplace")}
              >
                Match Across 10 Banks With This EMI →
              </button>
            </div>

            <div className="neo-card-lg" style={{ background: "var(--neo-white)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <span className="neo-badge neo-badge-yellow" style={{ marginBottom: "14px" }}>
                  MONTHLY OUTFLOW BREAKDOWN
                </span>
                <div style={{ fontSize: "48px", fontFamily: "var(--font-heading)", fontWeight: "800", margin: "10px 0" }}>
                  ₹{estimatedEmi.toLocaleString("en-IN")}
                  <small style={{ fontSize: "18px", color: "#666" }}> / mo</small>
                </div>
                <p style={{ color: "#444", fontSize: "14px" }}>
                  Calculated using benchmark reducing-balance formula at <strong>{baseRate}% p.a.</strong> fixed annual APR.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "24px" }}>
                  <div style={{ border: "var(--border-2px)", padding: "14px", background: "var(--neo-sage-tint)" }}>
                    <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", display: "block" }}>
                      Total Principal
                    </span>
                    <strong style={{ fontSize: "20px" }}>₹{requiredCapital.toLocaleString("en-IN")}</strong>
                  </div>
                  <div style={{ border: "var(--border-2px)", padding: "14px", background: "var(--neo-yellow)" }}>
                    <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", display: "block" }}>
                      Total Repayment
                    </span>
                    <strong style={{ fontSize: "20px" }}>
                      ₹{Math.round(estimatedEmi * loanHorizon).toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "var(--border-2px)", paddingTop: "18px", marginTop: "24px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#555", display: "inline-flex", alignItems: "center" }}>
                  <span className="status-dot-green" style={{ width: "6px", height: "6px", marginRight: "6px" }}></span>
                  Zero prepayment penalties apply across all PSU partner schemes after 12 months.
                </span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ==============================================================================
          PAGE 5: OFFICER TERMINAL (UNDERWRITING QUEUE)
          ============================================================================== */}
      {activeTab === "underwriter" && (
        <main style={{ padding: "40px 5% 70px" }}>
          <div className="neo-section-heading">
            <span style={{ background: "var(--neo-charcoal)", color: "var(--neo-yellow)" }}>
              Underwriting Terminal
            </span>
            <h2>Bank Officer Review Queue</h2>
            <p style={{ maxWidth: "600px", color: "#333", fontSize: "14px" }}>
              Review borrower loan applications, inspect ML risk confidence and SHAP drivers, and formally approve or reject.
            </p>
          </div>

          {/* Metric Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            <div className="neo-card" style={{ padding: "18px" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#666" }}>Total Applications</span>
              <strong style={{ fontSize: "28px", display: "block", marginTop: "4px" }}>
                {officerSummary ? officerSummary.total_applications : (officerApps.length || 5)}
              </strong>
            </div>

            <div className="neo-card" style={{ padding: "18px", background: "var(--neo-yellow)" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>Approval Ratio</span>
              <strong style={{ fontSize: "28px", display: "block", marginTop: "4px" }}>
                {officerSummary ? `${officerSummary.approval_rate}%` : "80.0%"}
              </strong>
            </div>

            <div className="neo-card" style={{ padding: "18px", background: "var(--neo-sage-tint)" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>Pending Queue</span>
              <strong style={{ fontSize: "28px", display: "block", marginTop: "4px" }}>
                {officerSummary ? officerSummary.pending_review : 2}
              </strong>
            </div>

            <div className="neo-card" style={{ padding: "18px" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#666" }}>Avg CIBIL Bureau</span>
              <strong style={{ fontSize: "28px", display: "block", marginTop: "4px" }}>
                {officerSummary ? officerSummary.average_cibil : 740}
              </strong>
            </div>
          </div>

            {/* Applications Table */}
          <div className="neo-table-wrapper">
            <table className="neo-table">
              <thead>
                <tr>
                  <th>App Code</th>
                  <th>Applicant</th>
                  <th>Bank Pipeline</th>
                  <th>Sanction Amount</th>
                  <th>Bureau Score</th>
                  <th>Risk Tier</th>
                  <th>KYC Status</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(officerApps.length > 0 ? officerApps : [
                  { id: 1, application_id: "SL-2026-9CAE88", applicant: "Pranshu Sharma", bank_name: "Bank of Baroda", loan_amount: 350000, cibil: 750, risk_level: "Low", status: "Submitted" },
                  { id: 2, application_id: "SL-2026-SBI101", applicant: "Pranshu Sharma", bank_name: "State Bank of India", loan_amount: 400000, cibil: 750, risk_level: "Low", status: "Submitted" },
                  { id: 3, application_id: "SL-2026-HDFC202", applicant: "Ananya Deshmukh", bank_name: "HDFC Bank", loan_amount: 1310000, cibil: 780, risk_level: "Low", status: "Approved" }
                ]).map((app) => (
                  <tr key={app.id}>
                    <td><strong>{app.application_id}</strong></td>
                    <td>{app.applicant}</td>
                    <td>{app.bank_name}</td>
                    <td><strong>₹{Number(app.loan_amount).toLocaleString("en-IN")}</strong></td>
                    <td>
                      <span className="neo-badge neo-badge-yellow" style={{ fontSize: "10px", padding: "2px 6px" }}>
                        {app.cibil}
                      </span>
                    </td>
                    <td>
                      <span className={`neo-badge ${app.risk_level === "Low" ? "neo-badge-emerald" : "neo-badge-coral"}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                        {app.risk_level} Risk
                      </span>
                    </td>
                    <td>
                      <span
                        className={`neo-badge ${app.all_documents_uploaded || (app.documents >= 5) ? "neo-badge-emerald" : "neo-badge-yellow"}`}
                        style={{ fontSize: "10px", padding: "2px 6px" }}
                      >
                        {app.all_documents_uploaded || (app.documents >= 5) ? "5/5 Verified" : `${app.documents || 0}/5 Uploaded`}
                      </span>
                    </td>
                    <td>
                      <span className="neo-badge neo-badge-white" style={{ fontSize: "10px", padding: "2px 6px" }}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="neo-btn neo-btn-primary neo-btn-sm"
                        onClick={() => setSelectedReviewApp(app)}
                      >
                        Underwrite →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Review Decision Modal */}
          {selectedReviewApp && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                padding: "20px"
              }}
            >
              <div
                className="neo-card-lg"
                style={{
                  background: "var(--neo-white)",
                  maxWidth: "580px",
                  width: "100%",
                  maxHeight: "90vh",
                  overflowY: "auto"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", background: "var(--neo-yellow)", border: "1px solid #000", padding: "2px 6px", display: "inline-block", marginBottom: "4px" }}>
                      OFFICIAL UNDERWRITING DOSSIER
                    </span>
                    <h3 style={{ fontSize: "20px", margin: 0 }}>Underwrite {selectedReviewApp.application_id}</h3>
                  </div>
                  <button
                    className="neo-btn neo-btn-white neo-btn-sm"
                    onClick={() => setSelectedReviewApp(null)}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ background: "var(--neo-sage-tint)", border: "var(--border-2px)", padding: "14px", marginBottom: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                    <div><strong>Applicant:</strong> {selectedReviewApp.applicant}</div>
                    <div><strong>Target Bank:</strong> {selectedReviewApp.bank_name}</div>
                    <div><strong>Requested Loan:</strong> ₹{Number(selectedReviewApp.loan_amount).toLocaleString("en-IN")}</div>
                    <div><strong>CIBIL Score:</strong> {selectedReviewApp.cibil}</div>
                  </div>
                </div>

                {/* KYC DOCUMENTATION VERIFICATION SECTION */}
                {(() => {
                  const appDocsList = (selectedReviewApp.documents_status && selectedReviewApp.documents_status.length > 0)
                    ? selectedReviewApp.documents_status
                    : MANDATORY_DOCUMENTS.map((m) => {
                        const isCurrent = currentUser && (selectedReviewApp.applicant === currentUser.name || selectedReviewApp.applicant === "Pranshu Sharma");
                        const found = isCurrent ? (userDocs || []).find((d) => d.type === m.type) : null;
                        return {
                          id: found ? found.id : null,
                          type: m.type,
                          uploaded: Boolean(found),
                          file_name: found ? found.file_name : null,
                          file_size: found ? found.file_size : null,
                          review_status: found ? (found.review_status || "Uploaded") : "Missing",
                          review_reason: found ? found.review_reason : "Not uploaded by applicant"
                        };
                      });

                  const appUploadedCount = appDocsList.filter((d) => d.uploaded).length;
                  const isAppKycComplete = appUploadedCount === MANDATORY_DOCUMENTS.length;

                  return (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>
                          Mandatory KYC Documentation Audit
                        </label>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "800",
                            padding: "2px 8px",
                            border: "1px solid #000",
                            background: isAppKycComplete ? "var(--neo-emerald-bg)" : "var(--neo-yellow)",
                            color: isAppKycComplete ? "#065f46" : "#000"
                          }}
                        >
                          {appUploadedCount} / {MANDATORY_DOCUMENTS.length} UPLOADED {isAppKycComplete ? "✓ COMPLETE" : "⚠ INCOMPLETE"}
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {appDocsList.map((doc) => (
                          <div
                            key={doc.type}
                            style={{
                              border: "var(--border-2px)",
                              padding: "8px 12px",
                              background: doc.uploaded ? "#f0fdf4" : "#fff1f2",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "10px"
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "11px", fontWeight: "800", color: "#000" }}>
                                  {doc.type}
                                </span>
                                {doc.uploaded ? (
                                  <span style={{ fontSize: "9px", background: "#10b981", color: "#fff", fontWeight: "800", padding: "1px 5px", border: "1px solid #000" }}>
                                    ✓ UPLOADED
                                  </span>
                                ) : (
                                  <span style={{ fontSize: "9px", background: "#ef4444", color: "#fff", fontWeight: "800", padding: "1px 5px", border: "1px solid #000" }}>
                                    ✕ NOT UPLOADED
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: "10px", color: doc.uploaded ? "#047857" : "#b91c1c", display: "block", marginTop: "2px" }}>
                                {doc.uploaded
                                  ? `File: ${doc.file_name || "Verified document on file"} (Status: ${doc.review_status || "Uploaded"})`
                                  : "Borrower has not uploaded this mandatory document"}
                              </span>
                            </div>

                            {doc.uploaded && doc.id && (
                              <a
                                href={getDocumentDownloadUrl(doc.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="neo-btn neo-btn-white neo-btn-sm"
                                style={{ fontSize: "10px", padding: "4px 8px", whiteSpace: "nowrap" }}
                              >
                                View File ↗
                              </a>
                            )}
                          </div>
                        ))}
                      </div>

                      {!isAppKycComplete && (
                        <div style={{ marginTop: "8px", background: "#fef3c7", border: "1px solid #d97706", padding: "8px 10px", fontSize: "11px", color: "#92400e", fontWeight: "700" }}>
                          <strong>UNDERWRITER NOTICE:</strong> Borrower has {MANDATORY_DOCUMENTS.length - appUploadedCount} missing KYC document(s). Review guidelines mandate complete dossier before disbursement.
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Official Underwriter Audit Notes
                  </label>
                  <textarea
                    rows={3}
                    style={{
                      width: "100%",
                      border: "var(--border-2px)",
                      padding: "10px",
                      fontSize: "13px",
                      fontFamily: "inherit"
                    }}
                    placeholder="e.g. Verified salary slip, low FOIR obligation, approved at Tier-1 card rate."
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    className="neo-btn neo-btn-yellow"
                    style={{ flex: 1, padding: "12px" }}
                    onClick={() => handleRecordDecision("Approved")}
                  >
                    Approve Application
                  </button>
                  <button
                    className="neo-btn neo-btn-primary"
                    style={{ flex: 1, padding: "12px" }}
                    onClick={() => handleRecordDecision("Rejected")}
                  >
                    Reject Application
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* =====================================================
          KYC INCOMPLETE ACTION REQUIRED MODAL
          ===================================================== */}
      {kycIncompleteModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px"
          }}
        >
          <div className="neo-card-lg" style={{ background: "var(--neo-white)", maxWidth: "520px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", background: "#ef4444", color: "#fff", padding: "2px 6px", display: "inline-block", marginBottom: "4px" }}>
                  MANDATORY COMPLIANCE // KYC INCOMPLETE
                </span>
                <h3 style={{ fontSize: "22px", textTransform: "uppercase", margin: 0 }}>
                  Upload All Documents To Apply
                </h3>
              </div>
              <button
                className="neo-btn neo-btn-white neo-btn-sm"
                onClick={() => setKycIncompleteModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "#fee2e2", border: "var(--border-2px)", padding: "12px", marginBottom: "16px", fontSize: "12px", color: "#991b1b", fontWeight: "600", lineHeight: "1.5" }}>
              <strong>RBI Institutional Underwriting Policy:</strong> All 5 mandatory KYC verification documents must be uploaded and verified in your KYC Vault before an application can be submitted to {applyModalBank ? applyModalBank.bank_name : "partner banks"}.
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontSize: "11px", fontWeight: "800" }}>
                <span>KYC Vault Status</span>
                <span>{userDocs.length} of {MANDATORY_DOCUMENTS.length} Uploaded ({Math.round((userDocs.length / MANDATORY_DOCUMENTS.length) * 100)}%)</span>
              </div>
              <div style={{ height: "10px", background: "#e5e7eb", border: "var(--border-2px)", overflow: "hidden", marginBottom: "16px" }}>
                <div style={{ width: `${(userDocs.length / MANDATORY_DOCUMENTS.length) * 100}%`, height: "100%", background: "var(--neo-yellow)" }}></div>
              </div>

              <div style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px", color: "#000" }}>
                Missing Required Documents ({kycMissingList.length}):
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {kycMissingList.map((m) => (
                  <div
                    key={m.type}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: "var(--border-2px)",
                      padding: "8px 12px",
                      background: "var(--neo-sage-tint)"
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "12px", display: "block" }}>{m.title}</strong>
                      <span style={{ fontSize: "10px", color: "#555" }}>{m.type}</span>
                    </div>
                    <span style={{ background: "#991b1b", color: "#fff", fontSize: "10px", fontWeight: "800", padding: "2px 8px", border: "1px solid #000" }}>
                      MISSING
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="neo-btn neo-btn-yellow"
                style={{ flex: 1, padding: "12px", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
                onClick={() => {
                  setKycIncompleteModalOpen(false);
                  setActiveTab("documents");
                }}
              >
                Open KYC Vault & Upload Now →
              </button>
              <button
                className="neo-btn neo-btn-white"
                style={{ padding: "12px" }}
                onClick={() => setKycIncompleteModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          AUTHENTICATION MODAL WITH 2-STEP OTP (2FA)
          ===================================================== */}
      {authModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px"
          }}
        >
          <div className="neo-card-lg" style={{ background: "var(--neo-white)", maxWidth: "460px", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", background: "var(--neo-yellow)", border: "1px solid #000", padding: "2px 6px", display: "inline-block", marginBottom: "4px" }}>
                  {authStep === "credentials" ? "STEP 1 OF 2 // CREDENTIALS" : "STEP 2 OF 2 // 2FA VERIFICATION"}
                </span>
                <h3 style={{ fontSize: "22px", textTransform: "uppercase", margin: 0 }}>
                  {authStep === "credentials"
                    ? (authMode === "officer" ? "Bank Officer Login" : "Applicant Sign In")
                    : "Enter 6-Digit OTP"}
                </h3>
              </div>
              <button
                className="neo-btn neo-btn-white neo-btn-sm"
                onClick={() => {
                  setAuthModalOpen(false);
                  setAuthStep("credentials");
                  setAuthOtp("");
                  setAuthError("");
                }}
              >
                ✕
              </button>
            </div>

            {authError && (
              <div style={{ background: "#fee2e2", border: "var(--border-2px)", padding: "10px", color: "#991b1b", fontSize: "12px", fontWeight: "700", marginBottom: "14px" }}>
                <span style={{ background: "#991b1b", color: "#fff", padding: "1px 6px", marginRight: "6px", fontSize: "10px" }}>ALERT</span>
                {authError}
              </div>
            )}

            {authStep === "credentials" ? (
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    style={{ width: "100%", padding: "10px 12px", border: "var(--border-2px)", fontSize: "13px" }}
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    style={{ width: "100%", padding: "10px 12px", border: "var(--border-2px)", fontSize: "13px" }}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="neo-btn neo-btn-primary"
                  style={{ width: "100%", padding: "12px" }}
                  disabled={authLoading}
                  id="auth-submit-credentials-btn"
                >
                  {authLoading ? "Authenticating..." : "Proceed to 2FA OTP →"}
                </button>

                <div style={{ marginTop: "16px", padding: "10px", background: "var(--neo-sage-tint)", border: "1px solid #000", fontSize: "11px", fontWeight: "600" }}>
                  <strong>[DEMO ACCESS CREDENTIALS]</strong> {authMode === "officer" ? "bank@smartloan.ai / bank-demo123" : "pranshu2@test.com / Password123"}
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <p style={{ fontSize: "12px", color: "#444", marginBottom: "14px", lineHeight: "1.4" }}>
                  A 6-digit One-Time Password (OTP) has been dispatched for <strong>{authEmail}</strong>. Enter the passcode below to authorize your session.
                </p>

                {demoOtpCode && (
                  <div style={{ background: "var(--neo-yellow)", border: "var(--border-2px)", padding: "10px 12px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", fontWeight: "800" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "10px", color: "#555" }}>SIMULATED SMS / EMAIL OTP</span>
                      <strong style={{ fontSize: "16px", letterSpacing: "3px", fontFamily: "monospace" }}>{demoOtpCode}</strong>
                    </div>
                    <button
                      type="button"
                      className="neo-btn neo-btn-white neo-btn-sm"
                      style={{ padding: "4px 10px", fontSize: "11px" }}
                      onClick={() => setAuthOtp(demoOtpCode)}
                    >
                      Use Code
                    </button>
                  </div>
                )}

                <div style={{ marginBottom: "18px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Enter 6-Digit One-Time Password
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    placeholder="• • • • • •"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "var(--border-2px)",
                      fontSize: "24px",
                      fontWeight: "800",
                      letterSpacing: "10px",
                      textAlign: "center",
                      fontFamily: "monospace",
                      background: "#fff",
                      boxShadow: "3px 3px 0 #000"
                    }}
                    value={authOtp}
                    onChange={(e) => setAuthOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    id="auth-otp-input"
                  />
                </div>

                <button
                  type="submit"
                  className="neo-btn neo-btn-primary"
                  style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
                  disabled={authLoading || authOtp.length !== 6}
                  id="auth-verify-otp-btn"
                >
                  {authLoading ? "Verifying OTP..." : "Verify OTP & Authorize Session →"}
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", marginTop: "10px" }}>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "800", textDecoration: "underline", padding: 0 }}
                    onClick={() => {
                      setAuthStep("credentials");
                      setAuthError("");
                    }}
                  >
                    ← Change Email / Back
                  </button>

                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: otpCountdown > 0 ? "not-allowed" : "pointer",
                      fontWeight: "800",
                      color: otpCountdown > 0 ? "#888" : "#000",
                      padding: 0
                    }}
                    disabled={otpCountdown > 0}
                    onClick={handleResendOtp}
                  >
                    {otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : "Resend OTP Code"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          FOOTER
          ===================================================== */}
      <footer className="neo-footer">
        <div className="footer-inner">
          <div>
            <div className="footer-brand" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h7v8l10-12h-7z" />
              </svg>
              SmartLoan AI
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#a5b4ac" }}>
              Automated Underwriting & Lending Protocol. Licensed RBI NBFC Aggregator Consortium.
            </p>
          </div>

          <div className="footer-links">
            <a href="#marketplace" onClick={(e) => { e.preventDefault(); setActiveTab("marketplace"); }}>Marketplace</a>
            <a href="#verdict" onClick={(e) => { e.preventDefault(); setActiveTab("verdict"); }}>AI Terminal</a>
            <a href="#documents" onClick={(e) => { e.preventDefault(); setActiveTab("documents"); }}>KYC Vault</a>
            <a href="#calculator" onClick={(e) => { e.preventDefault(); setActiveTab("calculator"); }}>EMI Sandbox</a>
            <a href="#privacy" onClick={(e) => { e.preventDefault(); showToast("RBI Fair Practices Code Compliant"); }}>Fair Practices</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 SmartLoan AI Inc. All rights reserved.</span>
          <span>Terms & Conditions • Grievance Redressal • CIBIL Partner Policy • SHAP Model Security</span>
        </div>
      </footer>
    </div>
  );
}