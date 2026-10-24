const API_BASE_URL = "http://127.0.0.1:8000";

// ======================================================
// COMMON REQUEST FUNCTION
// ======================================================

async function request(endpoint, options = {}) {
  const token = options.token !== undefined ? options.token : getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type");
  let data;
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = (typeof data === "object" && data !== null ? data.detail : data) || "Request failed";
    throw new Error(errorMsg);
  }

  return data;
}

// ======================================================
// AUTHENTICATION & TOKENS
// ======================================================

export function getToken() {
  return localStorage.getItem("smartloan_token");
}

export function saveToken(token) {
  localStorage.setItem("smartloan_token", token);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("smartloan_user")) || null;
  } catch (e) {
    return null;
  }
}

export function saveUser(user) {
  localStorage.setItem("smartloan_user", JSON.stringify(user));
}

export function logoutUser() {
  localStorage.removeItem("smartloan_token");
  localStorage.removeItem("smartloan_user");
}

export function getBankToken() {
  return localStorage.getItem("smartloan_bank_token");
}

export function saveBankToken(token) {
  localStorage.setItem("smartloan_bank_token", token);
}

export function getBankUser() {
  try {
    return JSON.parse(localStorage.getItem("smartloan_bank_user")) || null;
  } catch (e) {
    return null;
  }
}

export function saveBankUser(user) {
  localStorage.setItem("smartloan_bank_user", JSON.stringify(user));
}

export function logoutBankUser() {
  localStorage.removeItem("smartloan_bank_token");
  localStorage.removeItem("smartloan_bank_user");
}

// REGISTER APPLICANT
export async function registerUser(userData) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData)
  });
}

// VERIFY OTP
export async function verifyOTP(email, otp) {
  return request("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp })
  });
}

// APPLICANT LOGIN
export async function loginUser(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

// BANK OFFICER LOGIN
export async function bankLogin(email, password) {
  return request("/bank/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

// REQUEST LOGIN OTP (2FA Step 1)
export async function sendLoginOtp(email, password) {
  return request("/auth/send-login-otp", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

// VERIFY LOGIN OTP (2FA Step 2)
export async function verifyLoginOtp(email, otp) {
  return request("/auth/verify-login-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp })
  });
}

// SANCTION LETTER PDF DOWNLOAD URL
export function getSanctionLetterDownloadUrl(params = {}) {
  const query = new URLSearchParams(params).toString();
  return `${API_BASE_URL}/sanctions/provisional-letter.pdf${query ? `?${query}` : ""}`;
}

// ======================================================
// APPLICANT PROFILE
// ======================================================

export async function getApplicant() {
  return request("/applicant/", { method: "GET" });
}

export async function saveApplicant(data) {
  return request("/applicant/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function analyzeApplicant() {
  return request("/applicant/analyze", { method: "POST" });
}

export async function getPincode(pincode) {
  return request(`/pincode/${pincode}`, { method: "GET" });
}

// ======================================================
// DOCUMENTS
// ======================================================

export async function uploadDocument(documentType, file) {
  const formData = new FormData();
  formData.append("document_type", documentType);
  formData.append("file", file);

  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Document upload failed");
  }
  return data;
}

export async function getDocuments() {
  return request("/documents/", { method: "GET" });
}

export function getDocumentDownloadUrl(documentId) {
  return `${API_BASE_URL}/documents/${documentId}/download`;
}

// ======================================================
// BANK COMPARISON & RECOMMENDATIONS
// ======================================================

export async function compareBanks(amount, tenure) {
  const query = amount ? `?amount=${amount}&tenure=${tenure || 36}` : "";
  return request(`/banks/compare${query}`, { method: "GET" });
}

// ======================================================
// LOAN APPLICATIONS (APPLICANT SIDE)
// ======================================================

export async function createLoanApplication(applicationData) {
  return request("/applications", {
    method: "POST",
    body: JSON.stringify(applicationData)
  });
}

export async function listLoanApplications() {
  return request("/applications", { method: "GET" });
}

export async function getLoanApplication(id) {
  return request(`/applications/${id}`, { method: "GET" });
}

export async function calculateWhatIf(simData) {
  return request("/applications/what-if", {
    method: "POST",
    body: JSON.stringify(simData)
  });
}

export async function calculateEMI(emiData) {
  return request("/applications/emi", {
    method: "POST",
    body: JSON.stringify(emiData)
  });
}

// ======================================================
// BANK ADMIN PORTAL
// ======================================================

function bankRequest(endpoint, options = {}) {
  const token = getBankToken();
  return request(endpoint, {
    ...options,
    token
  });
}

export async function getBankDashboard() {
  return bankRequest("/bank/dashboard", { method: "GET" });
}

export async function getBankApplications(status = "") {
  const url = status ? `/bank/applications?status=${encodeURIComponent(status)}` : "/bank/applications";
  return bankRequest(url, { method: "GET" });
}

export async function getBankApplicationDetail(id) {
  return bankRequest(`/bank/applications/${id}`, { method: "GET" });
}

export async function reviewApplicationDecision(applicationId, decisionData) {
  return bankRequest(`/bank/applications/${applicationId}/review`, {
    method: "POST",
    body: JSON.stringify(decisionData)
  });
}

export async function reviewDocumentStatus(documentId, reviewData) {
  return bankRequest(`/bank/documents/${documentId}/review`, {
    method: "PATCH",
    body: JSON.stringify(reviewData)
  });
}

export async function getBankAnalytics() {
  return bankRequest("/bank/analytics", { method: "GET" });
}