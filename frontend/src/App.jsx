import { useState, useEffect } from "react";
import "./App.css";

import {
  registerUser,
  verifyOTP,
  loginUser,
  saveToken,
  getToken,
  getUser,
  saveUser,
  logoutUser,
  getBankToken,
  saveBankToken,
  getBankUser,
  saveBankUser,
  logoutBankUser,
  bankLogin,
  getApplicant,
  saveApplicant,
  analyzeApplicant,
  getPincode,
  uploadDocument,
  getDocuments,
  getDocumentDownloadUrl,
  compareBanks,
  createLoanApplication,
  listLoanApplications,
  getLoanApplication,
  calculateWhatIf,
  calculateEMI,
  getBankDashboard,
  getBankApplications,
  getBankApplicationDetail,
  reviewApplicationDecision,
  reviewDocumentStatus,
  getBankAnalytics,
} from "./api";

function App() {
  // =====================================================
  // NAVIGATION & PORTAL STATE
  // =====================================================
  const [portalMode, setPortalMode] = useState("applicant"); // "applicant" | "bank"
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "profile" | "banks" | "tracker" | "tools"
  const [bankTab, setBankTab] = useState("dashboard"); // "dashboard" | "analytics"

  // =====================================================
  // APPLICANT AUTH STATE
  // =====================================================
  const [authMode, setAuthMode] = useState("login"); // "login" | "register" | "verify"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [user, setUser] = useState(getUser());
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // =====================================================
  // BANK OFFICER AUTH STATE
  // =====================================================
  const [bankEmail, setBankEmail] = useState("bank@smartloan.ai");
  const [bankPassword, setBankPassword] = useState("bank-demo123");
  const [bankUser, setBankUser] = useState(getBankUser());
  const [bankAuthError, setBankAuthError] = useState("");
  const [bankAuthLoading, setBankAuthLoading] = useState(false);

  // =====================================================
  // APPLICANT PROFILE STATE
  // =====================================================
  const [profileExists, setProfileExists] = useState(false);
  const [age, setAge] = useState(29);
  const [employmentType, setEmploymentType] = useState("Salaried");
  const [annualIncome, setAnnualIncome] = useState(720000);
  const [monthlyIncome, setMonthlyIncome] = useState(60000);
  const [existingLoans, setExistingLoans] = useState(1);
  const [existingEmi, setExistingEmi] = useState(12000);
  const [loanAmount, setLoanAmount] = useState(400000);
  const [loanTerm, setLoanTerm] = useState("36");
  const [loanPurpose, setLoanPurpose] = useState("Personal");
  const [cibilScore, setCibilScore] = useState(740);
  const [creditUtilization, setCreditUtilization] = useState(25);
  const [creditAccounts, setCreditAccounts] = useState(3);
  const [missedPayments, setMissedPayments] = useState(0);
  const [employmentYears, setEmploymentYears] = useState(4);
  const [pincode, setPincode] = useState("440001");
  const [city, setCity] = useState("Nagpur");
  const [district, setDistrict] = useState("Nagpur");
  const [state, setState] = useState("Maharashtra");

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // =====================================================
  // DOCUMENTS STATE
  // =====================================================
  const documentTypes = [
    "PAN Card",
    "Aadhaar / KYC",
    "Income Proof",
    "Bank Statement",
    "Employment / Business Proof",
    "Current Address Proof",
  ];
  const docSubtitles = {
    "PAN Card": "Mandatory Tax ID & Identity Verification",
    "Aadhaar / KYC": "OVD / Address & Citizen Verification",
    "Income Proof": "Latest 3-6 Months Salary Slips or ITR with Computation",
    "Bank Statement": "Past 6 Months Bank Statement with salary/business inflows",
    "Employment / Business Proof": "Employee ID Card / Appointment Letter / Business GSTIN",
    "Current Address Proof": "Recent Electricity Bill / Water Bill / Rent Agreement",
  };
  const [documents, setDocuments] = useState([]);
  const [docCompleteness, setDocCompleteness] = useState(0);
  const [documentFiles, setDocumentFiles] = useState({});
  const [docUploading, setDocUploading] = useState(false);
  const [docMessage, setDocMessage] = useState("");
  const [docError, setDocError] = useState("");

  // =====================================================
  // AI ANALYSIS STATE
  // =====================================================
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // =====================================================
  // MULTI-BANK COMPARISON STATE
  // =====================================================
  const [banks, setBanks] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState("");
  const [banksLoaded, setBanksLoaded] = useState(false);
  const [interactiveLoanAmount, setInteractiveLoanAmount] = useState(400000);
  const [interactiveTenure, setInteractiveTenure] = useState(36);
  const [bankTypeFilter, setBankTypeFilter] = useState("All");

  // Apply Modal
  const [selectedBankForApply, setSelectedBankForApply] = useState(null);
  const [applyAmount, setApplyAmount] = useState(400000);
  const [applyTerm, setApplyTerm] = useState(36);
  const [applyNotes, setApplyNotes] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState("");
  const [applyError, setApplyError] = useState("");

  // =====================================================
  // APPLICATION TRACKER STATE
  // =====================================================
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [selectedAppDetail, setSelectedAppDetail] = useState(null);

  // =====================================================
  // FINANCIAL TOOLS (EMI & WHAT-IF)
  // =====================================================
  // EMI
  const [emiAmount, setEmiAmount] = useState(500000);
  const [emiRate, setEmiRate] = useState(10.5);
  const [emiTenure, setEmiTenure] = useState(36);
  const [emiResult, setEmiResult] = useState({
    monthly_emi: 16252.88,
    total_interest: 85103.68,
    total_repayment: 585103.68,
  });

  // What-If
  const [simCibil, setSimCibil] = useState(740);
  const [simLoanAmount, setSimLoanAmount] = useState(400000);
  const [simExistingEmi, setSimExistingEmi] = useState(12000);
  const [simUtilization, setSimUtilization] = useState(25);
  const [simMissedPayments, setSimMissedPayments] = useState(0);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // =====================================================
  // BANK OFFICER PORTAL STATE
  // =====================================================
  const [bankDashboard, setBankDashboard] = useState(null);
  const [bankApps, setBankApps] = useState([]);
  const [bankStatusFilter, setBankStatusFilter] = useState("");
  const [bankReviewApp, setBankReviewApp] = useState(null);
  const [decisionType, setDecisionType] = useState("Approved");
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionMessage, setDecisionMessage] = useState("");
  const [docReviewReason, setDocReviewReason] = useState("");
  const [bankAnalyticsData, setBankAnalyticsData] = useState(null);

  // =====================================================
  // INITIAL DATA LOADING
  // =====================================================
  useEffect(() => {
    if (user && portalMode === "applicant") {
      loadApplicantData();
      loadDocumentsList();
      loadUserApplications();
    }
  }, [user, portalMode]);

  useEffect(() => {
    if (bankUser && portalMode === "bank") {
      loadBankPortalData();
    }
  }, [bankUser, portalMode, bankStatusFilter]);

  // Recalculate EMI client-side
  useEffect(() => {
    const P = parseFloat(emiAmount) || 0;
    const rAnnual = parseFloat(emiRate) || 0;
    const n = parseInt(emiTenure, 10) || 1;
    if (P <= 0 || n <= 0) {
      setEmiResult({ monthly_emi: 0, total_interest: 0, total_repayment: 0 });
      return;
    }
    const r = rAnnual / 100 / 12;
    let emi = 0;
    if (r === 0) {
      emi = P / n;
    } else {
      emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    const totalRepay = emi * n;
    const totalInt = totalRepay - P;
    setEmiResult({
      monthly_emi: Math.round(emi * 100) / 100,
      total_interest: Math.round(Math.max(0, totalInt) * 100) / 100,
      total_repayment: Math.round(totalRepay * 100) / 100,
    });
  }, [emiAmount, emiRate, emiTenure]);

  // =====================================================
  // APPLICANT DATA FUNCTIONS
  // =====================================================
  async function loadApplicantData() {
    try {
      const data = await getApplicant();
      setProfileExists(true);
      setAge(data.age);
      setEmploymentType(data.employment_type);
      setAnnualIncome(data.annual_income);
      setMonthlyIncome(data.monthly_income);
      setExistingLoans(data.existing_loans);
      setExistingEmi(data.existing_emi);
      setLoanAmount(data.loan_amount);
      setApplyAmount(data.loan_amount);
      setLoanTerm(String(data.loan_term_months));
      setApplyTerm(data.loan_term_months);
      setLoanPurpose(data.loan_purpose);
      setCibilScore(data.cibil_score);
      setSimCibil(data.cibil_score);
      setCreditUtilization(Math.round((data.credit_utilization || 0) * 100));
      setCreditAccounts(data.credit_accounts || 0);
      setMissedPayments(data.missed_payments || 0);
      setEmploymentYears(data.employment_years || 0);
      setPincode(data.pincode || "440001");
      setCity(data.city || "Nagpur");
      setDistrict(data.district || "Nagpur");
      setState(data.state || "Maharashtra");
      setDocCompleteness(data.document_completeness ? Math.round(data.document_completeness * 100) : 0);
    } catch (err) {
      if (err.message !== "Applicant profile not found") {
        console.error("Profile load err:", err);
      }
    }
  }

  async function loadDocumentsList() {
    try {
      const data = await getDocuments();
      setDocuments(data.documents || []);
      if (data.document_completeness !== undefined) {
        setDocCompleteness(data.document_completeness);
      }
    } catch (err) {
      console.error("Docs load err:", err);
    }
  }

  async function loadUserApplications() {
    try {
      setAppsLoading(true);
      const list = await listLoanApplications();
      setApplications(list || []);
    } catch (err) {
      console.error("Apps load err:", err);
    } finally {
      setAppsLoading(false);
    }
  }

  // Handle PIN Code change & auto-fill
  async function handlePincodeChange(code) {
    setPincode(code);
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      try {
        const info = await getPincode(code);
        setCity(info.city);
        setDistrict(info.district);
        setState(info.state);
      } catch (err) {
        // Fallback or leave existing
      }
    }
  }

  // Save / Update Profile
  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileError("");
    setProfileMessage("");
    setProfileLoading(true);

    try {
      const parsedIncome = parseFloat(annualIncome) || 0;
      const parsedMonthly = parseFloat(monthlyIncome) || Math.round(parsedIncome / 12);
      const parsedAmount = parseFloat(loanAmount) || 0;
      const parsedCibil = parseInt(cibilScore, 10) || 700;

      const payload = {
        age: parseInt(age, 10),
        employment_type: employmentType,
        annual_income: parsedIncome,
        monthly_income: parsedMonthly,
        existing_loans: parseInt(existingLoans, 10) || 0,
        existing_emi: parseFloat(existingEmi) || 0,
        loan_amount: parsedAmount,
        loan_term_months: parseInt(loanTerm, 10) || 36,
        loan_purpose: loanPurpose,
        cibil_score: parsedCibil,
        credit_utilization: (parseFloat(creditUtilization) || 0) / 100,
        credit_accounts: parseInt(creditAccounts, 10) || 0,
        missed_payments: parseInt(missedPayments, 10) || 0,
        employment_years: parseFloat(employmentYears) || 0,
        pincode: pincode.trim(),
        document_completeness: docCompleteness / 100,
      };

      const res = await saveApplicant(payload);
      setProfileExists(true);
      setProfileMessage(res.message || "Profile successfully updated!");
      // Automatically trigger AI analysis
      runAIAnalysis();
    } catch (err) {
      setProfileError(err.message || "Failed to save profile");
    } finally {
      setProfileLoading(false);
    }
  }

  // Document Upload
  async function handleDocUpload(type) {
    const file = documentFiles[type];
    if (!file) {
      setDocError(`Please select a file to upload for ${type}`);
      return;
    }
    setDocError("");
    setDocMessage("");
    setDocUploading(true);

    try {
      const res = await uploadDocument(type, file);
      setDocMessage(`${type} uploaded successfully!`);
      setDocumentFiles((prev) => ({ ...prev, [type]: null }));
      await loadDocumentsList();
    } catch (err) {
      setDocError(err.message || "Upload failed");
    } finally {
      setDocUploading(false);
    }
  }

  // Run AI Underwriting Analysis
  async function runAIAnalysis() {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await analyzeApplicant();
      setAiAnalysis(res.ai_analysis);
    } catch (err) {
      setAiError(err.message || "AI Analysis failed");
    } finally {
      setAiLoading(false);
    }
  }

  // Multi-Bank Comparison with interactive parameters
  async function handleCompareBanks(overrideAmount, overrideTenure) {
    setBankLoading(true);
    setBankError("");
    try {
      const amt = overrideAmount !== undefined ? overrideAmount : interactiveLoanAmount;
      const ten = overrideTenure !== undefined ? overrideTenure : interactiveTenure;
      const res = await compareBanks(amt, ten);
      setBanks(res.eligible_banks || []);
      setBanksLoaded(true);
    } catch (err) {
      setBankError(err.message || "Failed to fetch bank comparisons");
      setBanks([]);
    } finally {
      setBankLoading(false);
    }
  }

  // Apply for loan modal action
  function openApplyModal(bank) {
    setSelectedBankForApply(bank);
    setApplyAmount(loanAmount);
    setApplyTerm(parseInt(loanTerm, 10) || 36);
    setApplyNotes(`Application submitted to ${bank.bank_name} based on multi-lender match.`);
    setApplySuccess("");
    setApplyError("");
  }

  async function handleConfirmApply(e) {
    e.preventDefault();
    if (!selectedBankForApply) return;
    setApplyLoading(true);
    setApplyError("");
    setApplySuccess("");

    try {
      const bankId = selectedBankForApply.bank_id ||
        (selectedBankForApply.bank_name === "SBI" ? 1 :
         selectedBankForApply.bank_name === "HDFC Bank" ? 2 :
         selectedBankForApply.bank_name === "ICICI Bank" ? 3 : 4);

      const appData = {
        bank_id: bankId,
        loan_amount: parseFloat(applyAmount),
        loan_term_months: parseInt(applyTerm, 10),
        requested_interest_rate: selectedBankForApply.interest_rate_min || 10.5,
        notes: applyNotes,
      };

      const newApp = await createLoanApplication(appData);
      setApplySuccess(`Loan Application ${newApp.application_id} submitted to ${selectedBankForApply.bank_name} successfully!`);
      await loadUserApplications();
      setTimeout(() => {
        setSelectedBankForApply(null);
        setActiveTab("tracker");
      }, 1500);
    } catch (err) {
      setApplyError(err.message || "Failed to submit loan application");
    } finally {
      setApplyLoading(false);
    }
  }

  // What-If Simulator Action
  async function handleRunWhatIf() {
    setSimLoading(true);
    try {
      const res = await calculateWhatIf({
        cibil_score: parseInt(simCibil, 10),
        loan_amount: parseFloat(simLoanAmount),
        existing_emi: parseFloat(simExistingEmi),
        credit_utilization: parseFloat(simUtilization) / 100,
        missed_payments: parseInt(simMissedPayments, 10),
      });
      setSimResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSimLoading(false);
    }
  }

  // =====================================================
  // BANK OFFICER PORTAL FUNCTIONS
  // =====================================================
  async function loadBankPortalData() {
    try {
      const dash = await getBankDashboard();
      setBankDashboard(dash);
      const apps = await getBankApplications(bankStatusFilter);
      setBankApps(apps || []);
      const analytics = await getBankAnalytics();
      setBankAnalyticsData(analytics);
    } catch (err) {
      console.error("Bank data error:", err);
    }
  }

  async function openReviewAppModal(appId) {
    try {
      const detail = await getBankApplicationDetail(appId);
      setBankReviewApp(detail);
      setDecisionType(detail.application.status === "Submitted" ? "Approved" : detail.application.status);
      setDecisionReason("");
      setDecisionNotes("");
      setDecisionMessage("");
    } catch (err) {
      alert("Failed to load application details: " + err.message);
    }
  }

  async function handleSubmitDecision(e) {
    e.preventDefault();
    if (!bankReviewApp) return;
    if (decisionType === "Rejected" && !decisionReason.trim()) {
      alert("A rejection reason is required for banking regulatory compliance.");
      return;
    }
    setDecisionLoading(true);
    setDecisionMessage("");

    try {
      await reviewApplicationDecision(bankReviewApp.application.id, {
        decision: decisionType,
        reason: decisionReason,
        notes: decisionNotes,
      });
      setDecisionMessage(`Application status updated to ${decisionType}!`);
      await loadBankPortalData();
      // refresh detail modal
      const updatedDetail = await getBankApplicationDetail(bankReviewApp.application.id);
      setBankReviewApp(updatedDetail);
    } catch (err) {
      alert(err.message || "Failed to record decision");
    } finally {
      setDecisionLoading(false);
    }
  }

  async function handleDocReview(docId, status) {
    let reason = "";
    if (status === "Rejected") {
      reason = prompt("Please provide reason for document rejection:", "Document unreadable or invalid KYC");
      if (!reason) return;
    }
    try {
      await reviewDocumentStatus(docId, { status, reason });
      alert(`Document status updated to ${status}!`);
      if (bankReviewApp) {
        const updatedDetail = await getBankApplicationDetail(bankReviewApp.application.id);
        setBankReviewApp(updatedDetail);
      }
    } catch (err) {
      alert(err.message || "Failed to update document status");
    }
  }

  // =====================================================
  // AUTH HANDLERS
  // =====================================================
  async function handleApplicantRegister(e) {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");
    setAuthLoading(true);
    try {
      const res = await registerUser({ name, email, phone, password });
      setAuthMessage(res.message);
      if (res.demo_otp) {
        setDemoOtp(res.demo_otp);
        setOtp(res.demo_otp);
      }
      setAuthMode("verify");
    } catch (err) {
      setAuthError(err.message || "Registration failed");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleApplicantVerify(e) {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");
    setAuthLoading(true);
    try {
      await verifyOTP(email, otp);
      setAuthMessage("OTP verified successfully! Please log in.");
      setAuthMode("login");
    } catch (err) {
      setAuthError(err.message || "OTP verification failed");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleApplicantLogin(e) {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");
    setAuthLoading(true);
    try {
      const res = await loginUser(email, password);
      saveToken(res.access_token);
      const usr = { id: res.user_id, name: res.name, email, bank_role: res.bank_role };
      saveUser(usr);
      setUser(usr);
      setAuthMessage("Login successful!");
    } catch (err) {
      setAuthError(err.message || "Invalid credentials");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleBankOfficerLogin(e) {
    e.preventDefault();
    setBankAuthError("");
    setBankAuthLoading(true);
    try {
      const res = await bankLogin(bankEmail, bankPassword);
      saveBankToken(res.access_token);
      const bUser = { id: res.user_id, name: res.name, email: bankEmail, role: res.role };
      saveBankUser(bUser);
      setBankUser(bUser);
    } catch (err) {
      setBankAuthError(err.message || "Bank officer authentication failed");
    } finally {
      setBankAuthLoading(false);
    }
  }

  function handleApplicantLogout() {
    logoutUser();
    setUser(null);
    setProfileExists(false);
    setAiAnalysis(null);
    setApplications([]);
    setDocuments([]);
  }

  function handleBankLogout() {
    logoutBankUser();
    setBankUser(null);
    setBankDashboard(null);
    setBankApps([]);
  }

  // =====================================================
  // RENDER HELPERS
  // =====================================================
  function getStatusBadgeClass(status) {
    const s = (status || "").toLowerCase().replace(/\s+/g, "-");
    return `status-badge badge-${s}`;
  }

  // =====================================================
  // MAIN RETURN
  // =====================================================
  return (
    <div className="app">
      {/* =====================================================
          TOP BAR
      ===================================================== */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">SL</div>
          <div>
            <h2>SmartLoan AI</h2>
            <span>AI-Driven Banking & Loan Underwriting</span>
          </div>
        </div>

        {/* PORTAL SWITCHER */}
        <div className="portal-switch-container">
          <button
            className={`portal-btn ${portalMode === "applicant" ? "active" : ""}`}
            onClick={() => setPortalMode("applicant")}
          >
            Applicant Portal
          </button>
          <button
            className={`portal-btn ${portalMode === "bank" ? "active" : ""}`}
            onClick={() => setPortalMode("bank")}
          >
            Bank Officer Portal
          </button>
        </div>

        {/* USER PROFILE & LOGOUT */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {portalMode === "applicant" && user ? (
            <>
              <span style={{ fontSize: "13px", color: "#c4b5fd", fontWeight: 600 }}>
                {user.name}
              </span>
              <button className="secondary-button" onClick={handleApplicantLogout} style={{ padding: "6px 14px", fontSize: "12px" }}>
                Logout
              </button>
            </>
          ) : portalMode === "bank" && bankUser ? (
            <>
              <span style={{ fontSize: "13px", color: "#4ade80", fontWeight: 600 }}>
                Officer: {bankUser.name}
              </span>
              <button className="secondary-button" onClick={handleBankLogout} style={{ padding: "6px 14px", fontSize: "12px" }}>
                Logout
              </button>
            </>
          ) : null}
        </div>
      </header>

      {/* =====================================================
          PORTAL CONTENT
      ===================================================== */}
      <main style={{ padding: "20px 7% 60px" }}>

        {/* ---------------------------------------------------
            1. APPLICANT PORTAL
        ---------------------------------------------------- */}
        {portalMode === "applicant" && (
          <div>
            {!user ? (
              /* AUTHENTICATION VIEW */
              <div style={{ maxWidth: "460px", margin: "40px auto" }}>
                <div className="calculator-card" style={{ padding: "30px" }}>
                  <div style={{ textAlign: "center", marginBottom: "24px" }}>
                    <h2 style={{ margin: "0 0 6px", fontSize: "22px", color: "#fff" }}>
                      {authMode === "login" ? "Applicant Login" : authMode === "register" ? "Create Account" : "Verify OTP"}
                    </h2>
                    <p style={{ margin: 0, color: "#808aa0", fontSize: "13px" }}>
                      Access AI loan evaluation and multi-lender rates
                    </p>
                  </div>

                  {/* Auth Tabs */}
                  <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                    <button
                      className={`portal-btn ${authMode === "login" ? "active" : ""}`}
                      style={{ flex: 1 }}
                      onClick={() => { setAuthMode("login"); setAuthError(""); setAuthMessage(""); }}
                    >
                      Sign In
                    </button>
                    <button
                      className={`portal-btn ${authMode === "register" ? "active" : ""}`}
                      style={{ flex: 1 }}
                      onClick={() => { setAuthMode("register"); setAuthError(""); setAuthMessage(""); }}
                    >
                      Register
                    </button>
                  </div>

                  {authError && <div className="error-message" style={{ marginBottom: "16px" }}>{authError}</div>}
                  {authMessage && <div style={{ color: "#4ade80", background: "rgba(34, 197, 94, 0.1)", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>{authMessage}</div>}

                  {authMode === "login" && (
                    <form onSubmit={handleApplicantLogin}>
                      <div className="slider-group">
                        <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Email Address</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="pranshu2@test.com"
                          style={{ width: "100%", padding: "10px", background: "#111420", border: "1px solid #23283a", borderRadius: "8px", color: "#fff" }}
                        />
                      </div>
                      <div className="slider-group">
                        <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Password</label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          style={{ width: "100%", padding: "10px", background: "#111420", border: "1px solid #23283a", borderRadius: "8px", color: "#fff" }}
                        />
                      </div>
                      <button type="submit" className="primary-button" disabled={authLoading} style={{ width: "100%", marginTop: "10px" }}>
                        {authLoading ? "Authenticating..." : "Sign In →"}
                      </button>
                      <div style={{ marginTop: "14px", fontSize: "11px", color: "#64748b", textAlign: "center" }}>
                        Demo testing hint: Try <code>pranshu2@test.com</code> or create a new account with instant demo OTP.
                      </div>
                    </form>
                  )}

                  {authMode === "register" && (
                    <form onSubmit={handleApplicantRegister}>
                      <div className="slider-group">
                        <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Full Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Pranshu Sharma"
                          style={{ width: "100%", padding: "10px", background: "#111420", border: "1px solid #23283a", borderRadius: "8px", color: "#fff" }}
                        />
                      </div>
                      <div className="slider-group">
                        <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Email</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="applicant@example.com"
                          style={{ width: "100%", padding: "10px", background: "#111420", border: "1px solid #23283a", borderRadius: "8px", color: "#fff" }}
                        />
                      </div>
                      <div className="slider-group">
                        <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Phone Number</label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="9876543210"
                          style={{ width: "100%", padding: "10px", background: "#111420", border: "1px solid #23283a", borderRadius: "8px", color: "#fff" }}
                        />
                      </div>
                      <div className="slider-group">
                        <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Password</label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          style={{ width: "100%", padding: "10px", background: "#111420", border: "1px solid #23283a", borderRadius: "8px", color: "#fff" }}
                        />
                      </div>
                      <button type="submit" className="primary-button" disabled={authLoading} style={{ width: "100%", marginTop: "10px" }}>
                        {authLoading ? "Registering..." : "Send Verification OTP →"}
                      </button>
                    </form>
                  )}

                  {authMode === "verify" && (
                    <form onSubmit={handleApplicantVerify}>
                      <div style={{ background: "rgba(124, 58, 237, 0.1)", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "12px", color: "#c4b5fd" }}>
                        A demo verification code was generated for <strong>{email}</strong>: <code>{demoOtp || "Check response"}</code>
                      </div>
                      <div className="slider-group">
                        <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>6-Digit OTP</label>
                        <input
                          type="text"
                          required
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          style={{ width: "100%", padding: "10px", background: "#111420", border: "1px solid #23283a", borderRadius: "8px", color: "#fff", textAlign: "center", letterSpacing: "4px", fontSize: "18px" }}
                        />
                      </div>
                      <button type="submit" className="primary-button" disabled={authLoading} style={{ width: "100%", marginTop: "10px" }}>
                        {authLoading ? "Verifying..." : "Verify & Activate Account"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              /* LOGGED IN APPLICANT PORTAL */
              <div>
                {/* SUB NAVIGATION TABS */}
                <div className="nav-tabs">
                  <button className={`nav-tab ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
                    📊 AI Underwriting & Score
                  </button>
                  <button className={`nav-tab ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
                    👤 Financial Profile & Documents
                  </button>
                  <button className={`nav-tab ${activeTab === "banks" ? "active" : ""}`} onClick={() => { setActiveTab("banks"); if (!banksLoaded) handleCompareBanks(); }}>
                    🏦 Multi-Bank Matcher
                  </button>
                  <button className={`nav-tab ${activeTab === "tracker" ? "active" : ""}`} onClick={() => { setActiveTab("tracker"); loadUserApplications(); }}>
                    📑 Loan Tracker ({applications.length})
                  </button>
                  <button className={`nav-tab ${activeTab === "tools" ? "active" : ""}`} onClick={() => setActiveTab("tools")}>
                    🧮 EMI & What-If Tools
                  </button>
                </div>

                {/* TAB 1: DASHBOARD & AI UNDERWRITING */}
                {activeTab === "dashboard" && (
                  <div>
                    {/* Top KPI Metrics */}
                    <div className="metric-grid">
                      <div className="metric-card">
                        <span>CIBIL Credit Score</span>
                        <strong style={{ color: cibilScore >= 750 ? "#4ade80" : cibilScore >= 700 ? "#60a5fa" : "#f87171" }}>
                          {cibilScore || "N/A"}
                        </strong>
                      </div>
                      <div className="metric-card">
                        <span>Debt-To-Income (DTI)</span>
                        <strong>
                          {monthlyIncome > 0 ? `${Math.round((existingEmi / monthlyIncome) * 100)}%` : "0%"}
                        </strong>
                      </div>
                      <div className="metric-card">
                        <span>Requested Loan</span>
                        <strong>₹{Number(loanAmount).toLocaleString("en-IN")}</strong>
                      </div>
                      <div className="metric-card">
                        <span>KYC Completeness</span>
                        <strong style={{ color: docCompleteness >= 80 ? "#4ade80" : "#fbbf24" }}>
                          {docCompleteness}%
                        </strong>
                      </div>
                    </div>

                    {/* AI Analysis Panel */}
                    <div className="calculator-card" style={{ marginBottom: "25px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                          <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "#fff" }}>
                            XGBoost AI Loan Underwriting Estimation
                          </h3>
                          <span style={{ fontSize: "12px", color: "#808aa0" }}>
                            Trained on 5,000 synthetic banking records with SHAP explainability
                          </span>
                        </div>
                        <button className="primary-button" onClick={runAIAnalysis} disabled={aiLoading} style={{ padding: "8px 18px", fontSize: "13px" }}>
                          {aiLoading ? "Analyzing ML Pipeline..." : "⚡ Run AI Evaluation"}
                        </button>
                      </div>

                      {aiError && <div className="error-message">{aiError}</div>}

                      {aiAnalysis ? (
                        <div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                            <div className="calc-results" style={{ margin: 0 }}>
                              <span>AI Prediction</span>
                              <strong style={{ color: aiAnalysis.prediction === "APPROVED" ? "#4ade80" : "#f87171" }}>
                                {aiAnalysis.prediction}
                              </strong>
                            </div>
                            <div className="calc-results" style={{ margin: 0 }}>
                              <span>Statistical Approval Probability</span>
                              <strong>{aiAnalysis.approval_probability}%</strong>
                            </div>
                            <div className="calc-results" style={{ margin: 0 }}>
                              <span>Risk Assessment</span>
                              <strong style={{ color: aiAnalysis.approval_probability >= 70 ? "#4ade80" : aiAnalysis.approval_probability >= 50 ? "#fbbf24" : "#f87171" }}>
                                {aiAnalysis.approval_probability >= 70 ? "Low Risk" : aiAnalysis.approval_probability >= 50 ? "Moderate" : "Elevated Risk"}
                              </strong>
                            </div>
                          </div>

                          {/* SHAP Feature Impact */}
                          <div style={{ background: "#0c0f1a", padding: "18px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #1e2436" }}>
                            <h4 style={{ margin: "0 0 12px", fontSize: "14px", color: "#c4b5fd" }}>
                              Top Contributing Factors (SHAP Feature Importance)
                            </h4>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
                              {aiAnalysis.shap_values?.map((item, idx) => (
                                <div key={idx} style={{ background: "#111420", padding: "10px 14px", borderRadius: "8px", border: "1px solid #1c2234", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: "12px", color: "#cbd5e1" }}>{item.feature.replace(/_/g, " ")}</span>
                                  <span style={{ fontSize: "12px", fontWeight: 700, color: item.shap_value >= 0 ? "#4ade80" : "#f87171" }}>
                                    {item.shap_value >= 0 ? `+${item.shap_value}` : item.shap_value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Human Explanations */}
                          <div style={{ marginBottom: "20px" }}>
                            <h4 style={{ margin: "0 0 12px", fontSize: "14px", color: "#94a3b8" }}>
                              Factor Analysis
                            </h4>
                            <div style={{ display: "grid", gap: "8px" }}>
                              {aiAnalysis.explanations?.map((exp, idx) => (
                                <div key={idx} style={{ padding: "10px 14px", borderRadius: "8px", fontSize: "12px", background: exp.type === "POSITIVE" ? "rgba(34, 197, 94, 0.08)" : exp.type === "WARNING" ? "rgba(245, 158, 11, 0.08)" : "rgba(239, 68, 68, 0.08)", border: `1px solid ${exp.type === "POSITIVE" ? "rgba(34, 197, 94, 0.2)" : exp.type === "WARNING" ? "rgba(245, 158, 11, 0.2)" : "rgba(239, 68, 68, 0.2)"}` }}>
                                  <strong style={{ color: exp.type === "POSITIVE" ? "#4ade80" : exp.type === "WARNING" ? "#fbbf24" : "#f87171" }}>
                                    {exp.factor}:{" "}
                                  </strong>
                                  <span style={{ color: "#e2e8f0" }}>{exp.message}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Improvement Plan */}
                          <div>
                            <h4 style={{ margin: "0 0 12px", fontSize: "14px", color: "#94a3b8" }}>
                              Actionable Profile Improvement Recommendations
                            </h4>
                            <div style={{ display: "grid", gap: "8px" }}>
                              {aiAnalysis.improvement_plan?.map((step, idx) => (
                                <div key={idx} style={{ background: "#0c0f1a", border: "1px solid #1e2436", padding: "12px", borderRadius: "8px", fontSize: "12px" }}>
                                  <span style={{ color: "#c4b5fd", fontWeight: 700 }}>{step.factor} (Target: {step.target}): </span>
                                  <span style={{ color: "#cbd5e1" }}>{step.action}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bank-disclaimer" style={{ marginTop: "18px" }}>
                            {aiAnalysis.disclaimer}
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                          Click "Run AI Evaluation" above to compute your real-time statistical approval probability and SHAP impact metrics.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: PROFILE & DOCUMENTS */}
                {activeTab === "profile" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "25px" }}>
                    {/* Left: Profile Form */}
                    <div className="calculator-card">
                      <h3 style={{ margin: "0 0 16px", fontSize: "18px", color: "#fff" }}>
                        Financial & Demographics Profile
                      </h3>
                      {profileMessage && <div style={{ color: "#4ade80", background: "rgba(34, 197, 94, 0.1)", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>{profileMessage}</div>}
                      {profileError && <div className="error-message" style={{ marginBottom: "16px" }}>{profileError}</div>}

                      <form onSubmit={handleSaveProfile}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div className="slider-group">
                            <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Age</label>
                            <input type="number" min="18" max="75" value={age} onChange={(e) => setAge(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111420", border: "1px solid #23283a", borderRadius: "6px", color: "#fff" }} />
                          </div>
                          <div className="slider-group">
                            <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Employment Type</label>
                            <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111420", border: "1px solid #23283a", borderRadius: "6px", color: "#fff" }}>
                              <option value="Salaried">Salaried</option>
                              <option value="Self Employed">Self Employed</option>
                              <option value="Business Owner">Business Owner</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div className="slider-group">
                            <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Annual Income (₹)</label>
                            <input type="number" min="50000" step="10000" value={annualIncome} onChange={(e) => { setAnnualIncome(e.target.value); setMonthlyIncome(Math.round((parseFloat(e.target.value) || 0) / 12)); }} required style={{ width: "100%", padding: "8px", background: "#111420", border: "1px solid #23283a", borderRadius: "6px", color: "#fff" }} />
                          </div>
                          <div className="slider-group">
                            <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Monthly Income (₹)</label>
                            <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111420", border: "1px solid #23283a", borderRadius: "6px", color: "#fff" }} />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div className="slider-group">
                            <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Existing Active Loans</label>
                            <input type="number" min="0" value={existingLoans} onChange={(e) => setExistingLoans(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111420", border: "1px solid #23283a", borderRadius: "6px", color: "#fff" }} />
                          </div>
                          <div className="slider-group">
                            <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Existing Monthly EMI (₹)</label>
                            <input type="number" min="0" value={existingEmi} onChange={(e) => setExistingEmi(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111420", border: "1px solid #23283a", borderRadius: "6px", color: "#fff" }} />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "12px" }}>
                          <div className="slider-group">
                            <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Loan Amount (₹)</label>
                            <input type="number" min="20000" step="10000" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111420", border: "1px solid #23283a", borderRadius: "6px", color: "#fff" }} />
                          </div>
                          <div className="slider-group">
                            <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Tenure (Months)</label>
                            <select value={loanTerm} onChange={(e) => setLoanTerm(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111420", border: "1px solid #23283a", borderRadius: "6px", color: "#fff" }}>
                              <option value="12">12 Months</option>
                              <option value="24">24 Months</option>
                              <option value="36">36 Months</option>
                              <option value="48">48 Months</option>
                              <option value="60">60 Months</option>
                            </select>
                          </div>
                          <div className="slider-group">
                            <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Loan Purpose</label>
                            <select value={loanPurpose} onChange={(e) => setLoanPurpose(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111420", border: "1px solid #23283a", borderRadius: "6px", color: "#fff" }}>
                              <option value="Personal">Personal</option>
                              <option value="Home">Home</option>
                              <option value="Education">Education</option>
                              <option value="Medical">Medical</option>
                              <option value="Vehicle">Vehicle</option>
                              <option value="Business">Business</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                          <div className="slider-group">
                            <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>CIBIL Score (300-900)</label>
                            <input type="number" min="300" max="900" value={cibilScore} onChange={(e) => setCibilScore(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111420", border: "1px solid #23283a", borderRadius: "6px", color: "#fff" }} />
                          </div>
                          <div className="slider-group">
                            <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Credit Utilization (%)</label>
                            <input type="number" min="0" max="100" value={creditUtilization} onChange={(e) => setCreditUtilization(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111420", border: "1px solid #23283a", borderRadius: "6px", color: "#fff" }} />
                          </div>
                          <div className="slider-group">
                            <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Missed Payments</label>
                            <input type="number" min="0" value={missedPayments} onChange={(e) => setMissedPayments(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111420", border: "1px solid #23283a", borderRadius: "6px", color: "#fff" }} />
                          </div>
                        </div>

                        {/* PIN Code Lookup */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", background: "#0c0f1a", padding: "12px", borderRadius: "8px", border: "1px solid #1e2436", marginBottom: "16px" }}>
                          <div className="slider-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: "11px", color: "#c4b5fd", display: "block", marginBottom: "4px" }}>PIN Code (Demo Lookup)</label>
                            <input type="text" maxLength="6" value={pincode} onChange={(e) => handlePincodeChange(e.target.value)} placeholder="440001" required style={{ width: "100%", padding: "8px", background: "#111420", border: "1px solid #7c3aed", borderRadius: "6px", color: "#fff", fontWeight: 700 }} />
                          </div>
                          <div className="slider-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>City / District</label>
                            <input type="text" value={`${city || ""}, ${district || ""}`} readOnly style={{ width: "100%", padding: "8px", background: "#111420", border: "1px solid #23283a", borderRadius: "6px", color: "#94a3b8" }} />
                          </div>
                          <div className="slider-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>State</label>
                            <input type="text" value={state || ""} readOnly style={{ width: "100%", padding: "8px", background: "#111420", border: "1px solid #23283a", borderRadius: "6px", color: "#94a3b8" }} />
                          </div>
                        </div>

                        <button type="submit" className="primary-button" disabled={profileLoading} style={{ width: "100%" }}>
                          {profileLoading ? "Saving Profile..." : "Save Profile & Update AI Score →"}
                        </button>
                      </form>
                    </div>

                    {/* Right: Document Upload Center */}
                    <div className="calculator-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                        <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>
                          KYC & Income Proofs
                        </h3>
                        <span style={{ fontSize: "12px", color: docCompleteness >= 80 ? "#4ade80" : "#fbbf24", fontWeight: 700 }}>
                          {docCompleteness}% Complete
                        </span>
                      </div>

                      {docMessage && <div style={{ color: "#4ade80", background: "rgba(34, 197, 94, 0.1)", padding: "10px", borderRadius: "8px", fontSize: "12px", marginBottom: "12px" }}>{docMessage}</div>}
                      {docError && <div className="error-message" style={{ marginBottom: "12px" }}>{docError}</div>}

                      {/* Upload Form for each category */}
                      <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
                        {documentTypes.map((type) => {
                          const uploaded = documents.find((d) => d.document_type === type);
                          return (
                            <div key={type} style={{ background: "#0c0f1a", border: "1px solid #1e2436", padding: "12px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                              <div>
                                <strong style={{ fontSize: "12px", color: "#fff", display: "block" }}>{type}</strong>
                                <span style={{ fontSize: "10px", color: "#808aa0", display: "block", marginBottom: "3px" }}>{docSubtitles[type]}</span>
                                {uploaded ? (
                                  <span style={{ fontSize: "11px", color: uploaded.review_status === "Verified" ? "#4ade80" : uploaded.review_status === "Rejected" ? "#f87171" : "#fbbf24" }}>
                                    ● {uploaded.review_status}: {uploaded.file_name} ({Math.round(uploaded.file_size / 1024)} KB)
                                  </span>
                                ) : (
                                  <span style={{ fontSize: "11px", color: "#64748b" }}>Not uploaded yet</span>
                                )}
                              </div>

                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  onChange={(e) => setDocumentFiles({ ...documentFiles, [type]: e.target.files[0] })}
                                  style={{ fontSize: "11px", color: "#94a3b8", maxWidth: "160px" }}
                                />
                                <button
                                  className="secondary-button"
                                  onClick={() => handleDocUpload(type)}
                                  disabled={docUploading || !documentFiles[type]}
                                  style={{ padding: "6px 12px", fontSize: "11px" }}
                                >
                                  Upload
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Uploaded Documents List */}
                      {documents.length > 0 && (
                        <div>
                          <h4 style={{ margin: "0 0 10px", fontSize: "13px", color: "#94a3b8" }}>Uploaded Files on Record:</h4>
                          <div style={{ display: "grid", gap: "8px" }}>
                            {documents.map((d) => (
                              <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111420", padding: "8px 12px", borderRadius: "6px", fontSize: "12px" }}>
                                <span>{d.document_type} - {d.file_name}</span>
                                <a
                                  href={getDocumentDownloadUrl(d.id)}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: "#a855f7", textDecoration: "none", fontWeight: 600 }}
                                >
                                  Download ↗
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: MULTI-BANK MATCHER */}
                {activeTab === "banks" && (
                  <div className="bank-comparison-section">
                    <div className="section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <span>Multi-Lender Match Engine</span>
                        <h2>Compare Leading Indian Bank Loan Schemes</h2>
                        <p>Real-time eligibility matching across verified lender rules for SBI, HDFC Bank, ICICI Bank, and Axis Bank.</p>
                      </div>
                      <button className="primary-button" onClick={handleCompareBanks} disabled={bankLoading}>
                        {bankLoading ? "Scanning Products..." : "🔄 Refresh Comparisons"}
                      </button>
                    </div>

                    {bankError && <div className="error-message">{bankError}</div>}

                    {/* Interactive Rate & Loan Amount Controls */}
                    <div className="calculator-card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", alignItems: "center" }}>
                        <div className="slider-group" style={{ margin: 0 }}>
                          <div className="slider-header">
                            <span style={{ fontSize: "12px", color: "#c4b5fd" }}>Interactive Loan Amount:</span>
                            <strong style={{ color: "#fff" }}>₹{Number(interactiveLoanAmount).toLocaleString("en-IN")}</strong>
                          </div>
                          <input
                            type="range"
                            min="50000"
                            max="3000000"
                            step="25000"
                            value={interactiveLoanAmount}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setInteractiveLoanAmount(val);
                              handleCompareBanks(val, interactiveTenure);
                            }}
                          />
                        </div>
                        <div className="slider-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "12px", color: "#c4b5fd", display: "block", marginBottom: "6px" }}>Repayment Tenure</label>
                          <select
                            value={interactiveTenure}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setInteractiveTenure(val);
                              handleCompareBanks(interactiveLoanAmount, val);
                            }}
                            style={{ width: "100%", padding: "8px 12px", background: "#111420", border: "1px solid #7c3aed", borderRadius: "6px", color: "#fff" }}
                          >
                            <option value={12}>12 Months (1 Year)</option>
                            <option value={24}>24 Months (2 Years)</option>
                            <option value={36}>36 Months (3 Years)</option>
                            <option value={48}>48 Months (4 Years)</option>
                            <option value={60}>60 Months (5 Years)</option>
                          </select>
                        </div>
                        <div className="slider-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "12px", color: "#c4b5fd", display: "block", marginBottom: "6px" }}>Lender Category</label>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {["All", "Public Lender", "Private Lender"].map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                className={`filter-pill ${bankTypeFilter === cat ? "active" : ""}`}
                                style={{ fontSize: "11px", padding: "6px 10px" }}
                                onClick={() => setBankTypeFilter(cat)}
                              >
                                {cat === "All" ? "All Lenders" : cat.replace(" Lender", "")}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {banks.length > 0 ? (
                      <div className="bank-grid">
                        {banks
                          .filter((b) => bankTypeFilter === "All" || b.bank_type === bankTypeFilter)
                          .map((bank, index) => (
                          <div key={bank.bank_name} className={`bank-card ${index === 0 ? "bank-card-best" : ""}`}>
                            {index === 0 && <div className="best-match-badge">BEST MATCH</div>}

                            <div>
                              <div className="bank-card-header">
                                <div>
                                  <h3>{bank.bank_name}</h3>
                                  <span>{bank.product_name}</span>
                                </div>
                                <div className="bank-score">
                                  <strong>{bank.match_score}%</strong>
                                  <span>Match</span>
                                </div>
                              </div>

                              <div className="bank-recommendation">
                                {bank.recommendation}
                              </div>

                              <div className="bank-details">
                                <div className="bank-detail">
                                  <span>Starting Rate</span>
                                  <strong>{bank.interest_rate_display}</strong>
                                </div>
                                <div className="bank-detail">
                                  <span>Processing Fee</span>
                                  <strong>{bank.processing_fee_display}</strong>
                                </div>
                                <div className="bank-detail">
                                  <span>Loan Range</span>
                                  <strong>₹{Number(bank.min_loan_amount).toLocaleString("en-IN")} - ₹{Number(bank.max_loan_amount).toLocaleString("en-IN")}</strong>
                                </div>
                                <div className="bank-detail">
                                  <span>Approval Window</span>
                                  <strong style={{ color: "#4ade80" }}>⏱ {bank.approval_time_display}</strong>
                                </div>
                                <div className="bank-detail" style={{ gridColumn: "span 2", background: "rgba(124, 58, 237, 0.1)", border: "1px solid rgba(124, 58, 237, 0.3)", borderRadius: "6px", padding: "8px 12px" }}>
                                  <span style={{ color: "#c4b5fd" }}>Estimated Monthly EMI:</span>
                                  <strong style={{ color: "#4ade80", fontSize: "15px" }}>
                                    ₹{Number(bank.estimated_monthly_emi || 0).toLocaleString("en-IN")} / mo
                                  </strong>
                                </div>
                              </div>

                              <div className="bank-reasons">
                                <h4>Why Recommended:</h4>
                                {bank.why_recommended?.map((r, rIdx) => (
                                  <div key={rIdx} className="bank-reason">
                                    <span>✓</span>
                                    <p>{r}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="bank-card-actions">
                                <a href={bank.source_url} target="_blank" rel="noreferrer" className="bank-source-btn">
                                  Official Page ↗
                                </a>
                                <button className="bank-apply-btn" onClick={() => openApplyModal(bank)}>
                                  Apply to Lender →
                                </button>
                              </div>
                              <div className="bank-disclaimer">
                                Eligibility estimates based on published criteria; final sanction is subject to lender verification.
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="calculator-card" style={{ textAlign: "center", padding: "40px" }}>
                        <p style={{ color: "#94a3b8" }}>No banks match your current profile criteria. Please update income or CIBIL score in your profile.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: LOAN TRACKER */}
                {activeTab === "tracker" && (
                  <div>
                    <div className="section-heading">
                      <span>Loan Application Lifecycle</span>
                      <h2>Your Submitted Loan Applications</h2>
                      <p>Track multi-stage status, document verification, and bank credit decisions in real-time.</p>
                    </div>

                    {applications.length > 0 ? (
                      <div className="calculator-card" style={{ padding: "10px" }}>
                        <table className="applications-table">
                          <thead>
                            <tr>
                              <th>Application ID</th>
                              <th>Lender Bank</th>
                              <th>Amount</th>
                              <th>Tenure</th>
                              <th>Status</th>
                              <th>AI Risk</th>
                              <th>Submitted On</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {applications.map((app) => (
                              <tr key={app.id}>
                                <td><strong style={{ color: "#c4b5fd" }}>{app.application_id}</strong></td>
                                <td>{app.bank_name}</td>
                                <td>₹{Number(app.loan_amount).toLocaleString("en-IN")}</td>
                                <td>{app.loan_term_months} Mo</td>
                                <td>
                                  <span className={getStatusBadgeClass(app.status)}>
                                    {app.status}
                                  </span>
                                </td>
                                <td>
                                  <span style={{ color: app.risk_level === "Low" ? "#4ade80" : app.risk_level === "Medium" ? "#fbbf24" : "#f87171", fontWeight: 600 }}>
                                    {app.risk_level || "Pending"}
                                  </span>
                                </td>
                                <td style={{ fontSize: "11px", color: "#94a3b8" }}>
                                  {new Date(app.created_at).toLocaleDateString()}
                                </td>
                                <td>
                                  <button className="action-link-btn" onClick={() => setSelectedAppDetail(app)}>
                                    View Audit Timeline →
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="calculator-card" style={{ textAlign: "center", padding: "40px" }}>
                        <p style={{ color: "#94a3b8" }}>You haven't submitted any loan applications yet.</p>
                        <button className="primary-button" onClick={() => { setActiveTab("banks"); handleCompareBanks(); }}>
                          Explore Eligible Lenders & Apply Now →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: FINANCIAL TOOLS (EMI & WHAT-IF) */}
                {activeTab === "tools" && (
                  <div className="tools-grid">
                    {/* Reducing-Balance EMI Calculator */}
                    <div className="calculator-card">
                      <h3 style={{ margin: "0 0 16px", fontSize: "18px", color: "#fff" }}>
                        Standard Reducing-Balance EMI Calculator
                      </h3>
                      <div className="slider-group">
                        <div className="slider-header">
                          <span>Loan Amount:</span>
                          <strong>₹{Number(emiAmount).toLocaleString("en-IN")}</strong>
                        </div>
                        <input
                          type="range"
                          min="50000"
                          max="5000000"
                          step="25000"
                          value={emiAmount}
                          onChange={(e) => setEmiAmount(e.target.value)}
                        />
                      </div>

                      <div className="slider-group">
                        <div className="slider-header">
                          <span>Annual Interest Rate:</span>
                          <strong>{emiRate}% p.a.</strong>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="25"
                          step="0.25"
                          value={emiRate}
                          onChange={(e) => setEmiRate(e.target.value)}
                        />
                      </div>

                      <div className="slider-group">
                        <div className="slider-header">
                          <span>Repayment Tenure:</span>
                          <strong>{emiTenure} Months ({Math.round(emiTenure / 12 * 10) / 10} Yrs)</strong>
                        </div>
                        <input
                          type="range"
                          min="6"
                          max="120"
                          step="6"
                          value={emiTenure}
                          onChange={(e) => setEmiTenure(e.target.value)}
                        />
                      </div>

                      <div className="calc-results">
                        <span>Monthly Installment (EMI)</span>
                        <strong>₹{Number(emiResult.monthly_emi).toLocaleString("en-IN")}</strong>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px", textAlign: "center" }}>
                        <div style={{ background: "#0c0f1a", padding: "10px", borderRadius: "8px", border: "1px solid #1e2436" }}>
                          <span style={{ fontSize: "11px", color: "#7b859c", display: "block" }}>Total Interest</span>
                          <strong style={{ color: "#fbbf24", fontSize: "15px" }}>₹{Number(emiResult.total_interest).toLocaleString("en-IN")}</strong>
                        </div>
                        <div style={{ background: "#0c0f1a", padding: "10px", borderRadius: "8px", border: "1px solid #1e2436" }}>
                          <span style={{ fontSize: "11px", color: "#7b859c", display: "block" }}>Total Repayment</span>
                          <strong style={{ color: "#e2e8f0", fontSize: "15px" }}>₹{Number(emiResult.total_repayment).toLocaleString("en-IN")}</strong>
                        </div>
                      </div>
                      <div className="bank-disclaimer" style={{ marginTop: "12px" }}>
                        Amortizing Reducing Balance formula: EMI = P × r × (1 + r)ⁿ / ((1 + r)ⁿ − 1). Actual bank terms may vary.
                      </div>
                    </div>

                    {/* What-If Simulator */}
                    <div className="calculator-card">
                      <h3 style={{ margin: "0 0 16px", fontSize: "18px", color: "#fff" }}>
                        Interactive What-If Eligibility Simulator
                      </h3>
                      <p style={{ fontSize: "12px", color: "#808aa0", marginTop: 0 }}>
                        Simulate how improving your credit profile or adjusting loan terms impacts AI approval probability.
                      </p>

                      <div className="slider-group">
                        <div className="slider-header">
                          <span>Simulated CIBIL Score:</span>
                          <strong>{simCibil}</strong>
                        </div>
                        <input
                          type="range"
                          min="500"
                          max="850"
                          step="10"
                          value={simCibil}
                          onChange={(e) => setSimCibil(e.target.value)}
                        />
                      </div>

                      <div className="slider-group">
                        <div className="slider-header">
                          <span>Simulated Existing EMI:</span>
                          <strong>₹{Number(simExistingEmi).toLocaleString("en-IN")}</strong>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="60000"
                          step="2000"
                          value={simExistingEmi}
                          onChange={(e) => setSimExistingEmi(e.target.value)}
                        />
                      </div>

                      <div className="slider-group">
                        <div className="slider-header">
                          <span>Simulated Credit Utilization:</span>
                          <strong>{simUtilization}%</strong>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="95"
                          step="5"
                          value={simUtilization}
                          onChange={(e) => setSimUtilization(e.target.value)}
                        />
                      </div>

                      <button className="primary-button" onClick={handleRunWhatIf} disabled={simLoading} style={{ width: "100%", marginTop: "6px" }}>
                        {simLoading ? "Simulating AI Outcome..." : "Simulate Scenario Impact →"}
                      </button>

                      {simResult && (
                        <div style={{ marginTop: "16px", background: "#0c0f1a", border: "1px solid #1e2436", borderRadius: "10px", padding: "14px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", textAlign: "center" }}>
                            <div style={{ background: "#111420", padding: "10px", borderRadius: "8px" }}>
                              <span style={{ fontSize: "11px", color: "#808aa0" }}>Current Probability</span>
                              <strong style={{ fontSize: "20px", display: "block", color: "#e2e8f0" }}>{simResult.current.approval_probability}%</strong>
                              <span style={{ fontSize: "10px", color: "#64748b" }}>DTI: {simResult.current.dti}%</span>
                            </div>
                            <div style={{ background: "rgba(124, 58, 237, 0.15)", border: "1px solid #7c3aed", padding: "10px", borderRadius: "8px" }}>
                              <span style={{ fontSize: "11px", color: "#c4b5fd" }}>Potential Outcome</span>
                              <strong style={{ fontSize: "20px", display: "block", color: "#4ade80" }}>{simResult.potential.approval_probability}%</strong>
                              <span style={{ fontSize: "10px", color: "#a855f7" }}>DTI: {simResult.potential.dti}%</span>
                            </div>
                          </div>
                          <div className="bank-disclaimer" style={{ marginTop: "10px" }}>
                            {simResult.message}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------
            2. BANK OFFICER PORTAL
        ---------------------------------------------------- */}
        {portalMode === "bank" && (
          <div>
            {!bankUser ? (
              /* BANK OFFICER LOGIN */
              <div style={{ maxWidth: "440px", margin: "40px auto" }}>
                <div className="calculator-card" style={{ padding: "30px" }}>
                  <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#fff", marginBottom: "10px" }}>
                      🏦
                    </div>
                    <h2 style={{ margin: "0 0 6px", fontSize: "22px", color: "#fff" }}>Bank Officer Portal</h2>
                    <p style={{ margin: 0, color: "#808aa0", fontSize: "13px" }}>Authorized Credit & Underwriting Terminal</p>
                  </div>

                  {bankAuthError && <div className="error-message" style={{ marginBottom: "16px" }}>{bankAuthError}</div>}

                  <form onSubmit={handleBankOfficerLogin}>
                    <div className="slider-group">
                      <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Officer Email</label>
                      <input
                        type="email"
                        required
                        value={bankEmail}
                        onChange={(e) => setBankEmail(e.target.value)}
                        style={{ width: "100%", padding: "10px", background: "#111420", border: "1px solid #23283a", borderRadius: "8px", color: "#fff" }}
                      />
                    </div>
                    <div className="slider-group">
                      <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Password</label>
                      <input
                        type="password"
                        required
                        value={bankPassword}
                        onChange={(e) => setBankPassword(e.target.value)}
                        style={{ width: "100%", padding: "10px", background: "#111420", border: "1px solid #23283a", borderRadius: "8px", color: "#fff" }}
                      />
                    </div>
                    <button type="submit" className="primary-button" disabled={bankAuthLoading} style={{ width: "100%", background: "#059669", borderColor: "#059669", marginTop: "10px" }}>
                      {bankAuthLoading ? "Authenticating Officer..." : "Sign In to Bank Terminal →"}
                    </button>
                    <div style={{ marginTop: "14px", fontSize: "11px", color: "#64748b", textAlign: "center" }}>
                      Demo Officer Account: <code>bank@smartloan.ai</code> / <code>bank-demo123</code>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              /* LOGGED IN BANK OFFICER VIEW */
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h2 style={{ margin: "0 0 4px", fontSize: "22px", color: "#fff" }}>
                      Lender Credit Underwriting Queue
                    </h2>
                    <span style={{ fontSize: "13px", color: "#808aa0" }}>
                      Logged in as Senior Credit Officer | Cross-Bank Verification Terminal
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className={`portal-btn ${bankTab === "dashboard" ? "active" : ""}`} onClick={() => setBankTab("dashboard")}>
                      Queue & Review
                    </button>
                    <button className={`portal-btn ${bankTab === "analytics" ? "active" : ""}`} onClick={() => setBankTab("analytics")}>
                      Portfolio Analytics
                    </button>
                  </div>
                </div>

                {/* Dashboard KPI cards */}
                {bankDashboard && (
                  <div className="metric-grid">
                    <div className="metric-card">
                      <span>Total Applications</span>
                      <strong>{bankDashboard.summary.total_applications}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Pending Review</span>
                      <strong style={{ color: "#fbbf24" }}>{bankDashboard.summary.pending_review}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Approved Loans</span>
                      <strong style={{ color: "#4ade80" }}>{bankDashboard.summary.approved}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Approval Rate</span>
                      <strong style={{ color: "#c4b5fd" }}>{bankDashboard.summary.approval_rate}%</strong>
                    </div>
                    <div className="metric-card">
                      <span>Average Portfolio CIBIL</span>
                      <strong>{bankDashboard.summary.average_cibil}</strong>
                    </div>
                  </div>
                )}

                {/* TAB 1: APPLICATIONS QUEUE */}
                {bankTab === "dashboard" && (
                  <div>
                    {/* Status Filter Bar */}
                    <div className="filter-bar">
                      <span style={{ fontSize: "12px", color: "#64748b", marginRight: "6px" }}>Filter:</span>
                      {["", "Submitted", "Under Review", "Documents Pending", "Approved", "Rejected"].map((st) => (
                        <button
                          key={st}
                          className={`filter-pill ${bankStatusFilter === st ? "active" : ""}`}
                          onClick={() => setBankStatusFilter(st)}
                        >
                          {st || "All Applications"}
                        </button>
                      ))}
                    </div>

                    <div className="calculator-card" style={{ padding: "10px" }}>
                      <table className="applications-table">
                        <thead>
                          <tr>
                            <th>App ID</th>
                            <th>Applicant</th>
                            <th>Email</th>
                            <th>Lender</th>
                            <th>Amount</th>
                            <th>CIBIL</th>
                            <th>Risk Tier</th>
                            <th>Docs</th>
                            <th>Status</th>
                            <th>Review Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bankApps.map((a) => (
                            <tr key={a.id}>
                              <td><strong style={{ color: "#c4b5fd" }}>{a.application_id}</strong></td>
                              <td>{a.applicant}</td>
                              <td>{a.email}</td>
                              <td>{a.bank_name}</td>
                              <td>₹{Number(a.loan_amount).toLocaleString("en-IN")}</td>
                              <td>
                                <strong style={{ color: a.cibil >= 750 ? "#4ade80" : a.cibil >= 700 ? "#60a5fa" : "#f87171" }}>
                                  {a.cibil || "N/A"}
                                </strong>
                              </td>
                              <td>
                                <span style={{ color: a.risk_level === "Low" ? "#4ade80" : a.risk_level === "Medium" ? "#fbbf24" : "#f87171", fontWeight: 700 }}>
                                  {a.risk_level || "Pending"}
                                </span>
                              </td>
                              <td>{a.documents} Files</td>
                              <td><span className={getStatusBadgeClass(a.status)}>{a.status}</span></td>
                              <td>
                                <button className="action-link-btn" onClick={() => openReviewAppModal(a.id)}>
                                  Review Application →
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 2: PORTFOLIO ANALYTICS */}
                {bankTab === "analytics" && bankAnalyticsData && (
                  <div className="tools-grid">
                    <div className="calculator-card">
                      <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#fff" }}>
                        Application Status Breakdown
                      </h3>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {Object.entries(bankAnalyticsData.status_counts || {}).map(([st, cnt]) => (
                          <div key={st} style={{ display: "flex", justifyContent: "space-between", background: "#0c0f1a", padding: "10px 14px", borderRadius: "8px", border: "1px solid #1e2436" }}>
                            <span style={{ fontSize: "13px", color: "#e2e8f0" }}>{st}</span>
                            <strong style={{ color: "#c4b5fd" }}>{cnt}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="calculator-card">
                      <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#fff" }}>
                        Applicant Employment & Risk Distribution
                      </h3>
                      <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
                        {Object.entries(bankAnalyticsData.employment_distribution || {}).map(([emp, cnt]) => (
                          <div key={emp} style={{ display: "flex", justifyContent: "space-between", background: "#0c0f1a", padding: "10px 14px", borderRadius: "8px", border: "1px solid #1e2436" }}>
                            <span style={{ fontSize: "13px", color: "#e2e8f0" }}>{emp}</span>
                            <strong>{cnt}</strong>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: "rgba(124, 58, 237, 0.1)", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Average KYC Completion: </span>
                        <strong style={{ color: "#4ade80", fontSize: "16px" }}>{bankAnalyticsData.average_document_completion}%</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =====================================================
          MODAL: APPLY TO BANK MODAL
      ===================================================== */}
      {selectedBankForApply && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2>Apply for {selectedBankForApply.bank_name} Loan</h2>
              <button className="modal-close-btn" onClick={() => setSelectedBankForApply(null)}>✕</button>
            </div>

            {applySuccess && <div style={{ color: "#4ade80", background: "rgba(34, 197, 94, 0.1)", padding: "12px", borderRadius: "8px", marginBottom: "14px" }}>{applySuccess}</div>}
            {applyError && <div className="error-message" style={{ marginBottom: "14px" }}>{applyError}</div>}

            <form onSubmit={handleConfirmApply}>
              <div style={{ background: "#111420", padding: "14px", borderRadius: "8px", border: "1px solid #242a3c", marginBottom: "16px" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>Selected Scheme:</span>
                <strong style={{ fontSize: "16px", color: "#fff" }}>{selectedBankForApply.product_name}</strong>
                <span style={{ fontSize: "12px", color: "#4ade80", display: "block", marginTop: "4px" }}>
                  Expected Starting Rate: {selectedBankForApply.interest_rate_display}
                </span>
              </div>

              <div className="slider-group">
                <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Requested Loan Amount (₹)</label>
                <input
                  type="number"
                  min={selectedBankForApply.min_loan_amount}
                  max={selectedBankForApply.max_loan_amount}
                  value={applyAmount}
                  onChange={(e) => setApplyAmount(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", background: "#111420", border: "1px solid #23283a", borderRadius: "8px", color: "#fff" }}
                />
              </div>

              <div className="slider-group">
                <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Repayment Tenure (Months)</label>
                <select value={applyTerm} onChange={(e) => setApplyTerm(e.target.value)} style={{ width: "100%", padding: "10px", background: "#111420", border: "1px solid #23283a", borderRadius: "8px", color: "#fff" }}>
                  <option value="12">12 Months (1 Year)</option>
                  <option value="24">24 Months (2 Years)</option>
                  <option value="36">36 Months (3 Years)</option>
                  <option value="48">48 Months (4 Years)</option>
                  <option value="60">60 Months (5 Years)</option>
                </select>
              </div>

              <div className="slider-group">
                <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Application Remarks / Notes</label>
                <textarea
                  rows="3"
                  value={applyNotes}
                  onChange={(e) => setApplyNotes(e.target.value)}
                  placeholder="Additional context for lender credit team"
                  style={{ width: "100%", padding: "10px", background: "#111420", border: "1px solid #23283a", borderRadius: "8px", color: "#fff" }}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setSelectedBankForApply(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={applyLoading}>
                  {applyLoading ? "Submitting to Bank..." : "Confirm & Submit Application →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL: APPLICANT TIMELINE DETAIL MODAL
      ===================================================== */}
      {selectedAppDetail && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2>Application Audit Trail</h2>
              <button className="modal-close-btn" onClick={() => setSelectedAppDetail(null)}>✕</button>
            </div>

            <div style={{ background: "#111420", padding: "14px", borderRadius: "8px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#808aa0" }}>Application ID:</span>
                  <strong style={{ fontSize: "15px", display: "block", color: "#c4b5fd" }}>{selectedAppDetail.application_id}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#808aa0" }}>Current Status:</span>
                  <div style={{ marginTop: "4px" }}><span className={getStatusBadgeClass(selectedAppDetail.status)}>{selectedAppDetail.status}</span></div>
                </div>
              </div>
            </div>

            <h4 style={{ margin: "16px 0 8px", fontSize: "13px", color: "#94a3b8" }}>Status Change Timeline:</h4>
            <div className="timeline-list">
              {selectedAppDetail.status_history?.map((h, i) => (
                <div key={i} className="timeline-entry">
                  <div>
                    <strong>{h.status}</strong>
                    <span style={{ display: "block", color: "#cbd5e1" }}>{h.notes}</span>
                    <span style={{ fontSize: "10px", color: "#64748b" }}>{new Date(h.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setSelectedAppDetail(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL: BANK OFFICER REVIEW DRAWER
      ===================================================== */}
      {bankReviewApp && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: "800px" }}>
            <div className="modal-header">
              <div>
                <h2>Review Application: {bankReviewApp.application.application_id}</h2>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>Lender: {bankReviewApp.application.bank} | Status: {bankReviewApp.application.status}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setBankReviewApp(null)}>✕</button>
            </div>

            {decisionMessage && (
              <div style={{ color: "#4ade80", background: "rgba(34, 197, 94, 0.1)", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                {decisionMessage}
              </div>
            )}

            {/* Applicant Financial Summary */}
            {bankReviewApp.applicant && (
              <div style={{ background: "#0c0f1a", border: "1px solid #1e2436", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "13px", color: "#c4b5fd" }}>Applicant Credit & Demographics</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", fontSize: "12px" }}>
                  <div><span>Name:</span> <strong>{bankReviewApp.applicant.name}</strong></div>
                  <div><span>Email:</span> <strong>{bankReviewApp.applicant.email}</strong></div>
                  <div><span>Phone:</span> <strong>{bankReviewApp.applicant.phone}</strong></div>
                  <div><span>Annual Income:</span> <strong>₹{Number(bankReviewApp.applicant.annual_income).toLocaleString("en-IN")}</strong></div>
                  <div><span>Existing EMI:</span> <strong>₹{Number(bankReviewApp.applicant.existing_emi).toLocaleString("en-IN")}</strong></div>
                  <div><span>DTI Ratio:</span> <strong>{Math.round(bankReviewApp.applicant.dti * 100)}%</strong></div>
                  <div><span>CIBIL Score:</span> <strong style={{ color: bankReviewApp.applicant.cibil_score >= 700 ? "#4ade80" : "#f87171" }}>{bankReviewApp.applicant.cibil_score}</strong></div>
                  <div><span>Credit Utilization:</span> <strong>{Math.round(bankReviewApp.applicant.credit_utilization * 100)}%</strong></div>
                  <div><span>Address:</span> <strong>{bankReviewApp.applicant.city}, {bankReviewApp.applicant.state} ({bankReviewApp.applicant.pincode})</strong></div>
                </div>
              </div>
            )}

            {/* AI Risk Assessment */}
            <div style={{ background: "#0c0f1a", border: "1px solid #1e2436", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 10px", fontSize: "13px", color: "#c4b5fd" }}>AI Underwriting Intelligence</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", textAlign: "center" }}>
                <div style={{ background: "#111420", padding: "10px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#808aa0" }}>Approval Probability</span>
                  <strong style={{ fontSize: "18px", display: "block", color: "#4ade80" }}>{Math.round((bankReviewApp.ai.approval_probability || 0.5) * 100)}%</strong>
                </div>
                <div style={{ background: "#111420", padding: "10px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#808aa0" }}>Risk Level</span>
                  <strong style={{ fontSize: "18px", display: "block", color: bankReviewApp.ai.risk_level === "Low" ? "#4ade80" : "#fbbf24" }}>{bankReviewApp.ai.risk_level || "Medium"}</strong>
                </div>
                <div style={{ background: "#111420", padding: "10px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#808aa0" }}>Readiness Score</span>
                  <strong style={{ fontSize: "18px", display: "block", color: "#c4b5fd" }}>{bankReviewApp.ai.readiness_score || 75}/100</strong>
                </div>
              </div>
            </div>

            {/* Document Verification Actions */}
            <div style={{ background: "#0c0f1a", border: "1px solid #1e2436", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 10px", fontSize: "13px", color: "#c4b5fd" }}>Uploaded Document Verification</h4>
              {bankReviewApp.documents?.length > 0 ? (
                <div style={{ display: "grid", gap: "8px" }}>
                  {bankReviewApp.documents.map((d) => (
                    <div key={d.id} style={{ background: "#111420", padding: "10px 14px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <strong style={{ fontSize: "12px", color: "#fff" }}>{d.type}: {d.file_name}</strong>
                        <span style={{ fontSize: "11px", display: "block", color: d.review_status === "Verified" ? "#4ade80" : d.review_status === "Rejected" ? "#f87171" : "#fbbf24" }}>
                          Status: {d.review_status} {d.review_reason ? `(${d.review_reason})` : ""}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <a href={getDocumentDownloadUrl(d.id)} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#a855f7", textDecoration: "none", fontWeight: 600 }}>
                          Download ↗
                        </a>
                        <button className="secondary-button" onClick={() => handleDocReview(d.id, "Verified")} style={{ padding: "4px 10px", fontSize: "11px", color: "#4ade80", borderColor: "#4ade80" }}>
                          ✓ Verify
                        </button>
                        <button className="secondary-button" onClick={() => handleDocReview(d.id, "Rejected")} style={{ padding: "4px 10px", fontSize: "11px", color: "#f87171", borderColor: "#f87171" }}>
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#64748b", fontSize: "12px" }}>No documents uploaded by applicant.</div>
              )}
            </div>

            {/* Decision Recording Form */}
            <form onSubmit={handleSubmitDecision} style={{ background: "#111420", border: "1px solid #7c3aed", borderRadius: "10px", padding: "16px" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: "14px", color: "#c4b5fd" }}>Record Official Credit Decision</h4>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Decision</label>
                  <select value={decisionType} onChange={(e) => setDecisionType(e.target.value)} style={{ width: "100%", padding: "8px", background: "#0c0f1a", border: "1px solid #23283a", borderRadius: "6px", color: "#fff" }}>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Documents Pending">Documents Pending</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Decision Reason (Mandatory if Rejected)</label>
                  <input
                    type="text"
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="e.g. CIBIL score below cutoff / Insufficient income"
                    style={{ width: "100%", padding: "8px", background: "#0c0f1a", border: "1px solid #23283a", borderRadius: "6px", color: "#fff" }}
                  />
                </div>
              </div>

              <div className="slider-group" style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Internal Officer Notes</label>
                <textarea
                  rows="2"
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Compliance remarks recorded in audit history"
                  style={{ width: "100%", padding: "8px", background: "#0c0f1a", border: "1px solid #23283a", borderRadius: "6px", color: "#fff" }}
                />
              </div>

              <div className="modal-actions" style={{ margin: 0 }}>
                <button type="submit" className="primary-button" disabled={decisionLoading} style={{ background: decisionType === "Approved" ? "#059669" : decisionType === "Rejected" ? "#dc2626" : "#7c3aed" }}>
                  {decisionLoading ? "Recording..." : `Confirm Decision: ${decisionType} →`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;