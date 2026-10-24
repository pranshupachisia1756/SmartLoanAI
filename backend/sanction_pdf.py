import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas


def generate_sanction_letter_pdf(
    applicant_name: str = "Pranshu Pachisia",
    amount: int = 4500000,
    rate: float = 10.25,
    tenure: int = 60,
    bank_name: str = "HDFC Bank (Consortium Spotlight)",
    cibil_score: int = 750,
    confidence: float = 98.04
) -> bytes:
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # 1. Top Header Banner (Neo-Brutalist Charcoal)
    p.setFillColor(colors.HexColor("#171e19"))
    p.rect(0, height - 85, width, 85, fill=1, stroke=0)

    # Accent Yellow Stripe
    p.setFillColor(colors.HexColor("#ffe17c"))
    p.rect(0, height - 90, width, 5, fill=1, stroke=0)

    # Header Brand Text
    p.setFillColor(colors.HexColor("#ffe17c"))
    p.setFont("Helvetica-Bold", 16)
    p.drawString(40, height - 42, "SMARTLOAN AI")
    p.setFont("Helvetica", 11)
    p.drawString(170, height - 42, "// INSTITUTIONAL CREDIT UNDERWRITING PROTOCOL")

    p.setFillColor(colors.HexColor("#d8e3e0"))
    p.setFont("Helvetica", 9)
    p.drawString(40, height - 68, "RBI DLRE CONSORTIUM CLEARINGHOUSE • FAST-TRACK NETBANKING PIPELINE")
    p.drawRightString(width - 40, height - 68, f"REF: SL-AI/2026/IND-{abs(hash(applicant_name)) % 9000 + 1000}-V1")

    # 2. Main Title Callout Card
    y = height - 160
    p.setFillColor(colors.HexColor("#fffdf5"))
    p.setStrokeColor(colors.black)
    p.setLineWidth(2)
    p.rect(40, y, width - 80, 56, fill=1, stroke=1)

    # Hard shadow simulation
    p.setFillColor(colors.HexColor("#171e19"))
    p.rect(44, y - 4, width - 80, 4, fill=1, stroke=0)
    p.rect(width - 40, y - 4, 4, 56, fill=1, stroke=0)

    p.setFillColor(colors.HexColor("#171e19"))
    p.setFont("Helvetica-Bold", 13)
    p.drawString(55, y + 34, "PROVISIONAL CREDIT SANCTION LETTER (IN-PRINCIPLE)")
    p.setFont("Helvetica", 9)
    issue_date = datetime.now().strftime("%d %B %Y")
    p.drawString(55, y + 16, f"Issue Date: {issue_date} • Verification Status: RBI Fast-Track Pre-Approved ({confidence}% Confidence)")

    p.setFillColor(colors.HexColor("#064e3b"))
    p.setFont("Helvetica-Bold", 10)
    p.drawRightString(width - 55, y + 25, "● PRE-APPROVED")

    # 3. Addressee Info
    y -= 45
    p.setFillColor(colors.HexColor("#171e19"))
    p.setFont("Helvetica-Bold", 10)
    p.drawString(40, y, "TO THE APPLICANT:")
    p.setFont("Helvetica", 10)
    p.drawString(150, y, f"{applicant_name} (Applicant ID: #APP-{abs(hash(applicant_name)) % 8000 + 1000})")

    y -= 16
    p.setFont("Helvetica-Bold", 10)
    p.drawString(40, y, "BUREAU STATUS:")
    p.setFont("Helvetica", 10)
    p.drawString(150, y, f"CIBIL Telemetry: {cibil_score} / 900 (Prime-A Borrower Grade • Top 8% National Percentile)")

    # Intro Paragraph
    y -= 30
    p.setFont("Helvetica", 9)
    intro_text = (
        "We are pleased to inform you that your retail credit application has been processed by the SmartLoan AI Neural "
        "Underwriting Engine. Based on evaluated debt-to-income capacity (FOIR: 16%), continuous bureau vintage, and "
        "multi-lender routing, the following provisional credit sanction has been issued in-principle:"
    )
    # Simple wrap
    p.drawString(40, y, intro_text[:115])
    p.drawString(40, y - 13, intro_text[115:225])
    p.drawString(40, y - 26, intro_text[225:])

    # 4. Core Sanction Terms Table
    y -= 52
    p.setFillColor(colors.HexColor("#171e19"))
    p.setFont("Helvetica-Bold", 11)
    p.drawString(40, y, "APPROVED CREDIT TERMS & PARAMETERS")

    y -= 14
    table_x = 40
    table_w = width - 80
    row_h = 24

    terms = [
        ("Sanctioned Facility", "Unsecured Personal Credit Line / Instant NetBanking"),
        ("Maximum Approved Sanction", f"Rs. {amount:,.0f}/- (Rupees Forty-Five Lakhs Only)"),
        ("Benchmark Interest Yield", f"{rate:.2f}% p.a. (Fixed Repo-Linked 6.50% Base Tier)"),
        ("Selected Repayment Horizon", f"{tenure} Months ({tenure // 12} Years Flexible Horizon)"),
        ("Indicative Monthly Installment", f"Rs. {round((amount * ((rate/12)/100) * (1+(rate/12)/100)**tenure) / ((1+(rate/12)/100)**tenure - 1)):,.0f} / month"),
        ("Processing Fee Protocol", "Rs. 0/- (100% Platform Waiver Applied, Saved Rs. 6,500)"),
        ("Prepayment / Foreclosure Terms", "NIL Charges after 12 monthly installments across PSU/Private terms"),
        ("Primary Disbursing Lender", f"{bank_name}")
    ]

    p.setLineWidth(1)
    for i, (label, val) in enumerate(terms):
        row_y = y - (i * row_h)
        # Alternate background
        if i % 2 == 0:
            p.setFillColor(colors.HexColor("#fffdf5"))
        else:
            p.setFillColor(colors.HexColor("#f8faf9"))
        p.rect(table_x, row_y - row_h + 4, table_w, row_h, fill=1, stroke=1)

        p.setFillColor(colors.HexColor("#171e19"))
        p.setFont("Helvetica-Bold", 9)
        p.drawString(table_x + 10, row_y - 12, label)

        p.setFont("Helvetica", 9)
        if "Maximum Approved" in label or "Benchmark" in label:
            p.setFont("Helvetica-Bold", 9)
        p.drawString(table_x + 220, row_y - 12, val)

    y -= (len(terms) * row_h) + 15

    # 5. SHAP Mathematical Attribution Summary Box
    p.setFillColor(colors.HexColor("#d8e3e0"))
    p.setStrokeColor(colors.black)
    p.setLineWidth(1.5)
    p.rect(table_x, y - 55, table_w, 55, fill=1, stroke=1)

    p.setFillColor(colors.HexColor("#171e19"))
    p.setFont("Helvetica-Bold", 10)
    p.drawString(table_x + 12, y - 16, "NEURAL AI DECISION ATTRIBUTION (SHAP VALUES)")
    p.setFont("Helvetica", 8.5)
    p.drawString(table_x + 12, y - 30, "● Positive Drivers (+92 pts): 5+ Years repayment vintage (+42 pts), Low 16% FOIR obligations (+35 pts), Diverse credit mix (+15 pts)")
    p.drawString(table_x + 12, y - 44, "● Risk Margin Sensitivities (-24 pts): 28% Revolving card utilization (-12 pts), Recent inquiry count (-8 pts), Mandate linking (-4 pts)")

    y -= 75

    # 6. Disbursal Conditions & Legal Undertaking
    p.setFont("Helvetica-Bold", 9)
    p.drawString(40, y, "CONDITIONS PRECEDENT TO FINAL DISBURSAL:")
    p.setFont("Helvetica", 8)
    y -= 12
    p.drawString(40, y, "1. Aadhaar e-KYC and digital PAN verification via UIDAI / NSDL API pipeline.")
    y -= 11
    p.drawString(40, y, "2. Digital mandate activation (e-NACH / NPCI) for automated installment clearance.")
    y -= 11
    p.drawString(40, y, "3. Execution of e-Sign electronic loan agreement compliant with IT Act 2000 & RBI DLRE Guidelines.")

    # 7. Signature & Stamp Box
    y -= 60
    p.setLineWidth(1)
    # Left Signature
    p.line(50, y + 16, 200, y + 16)
    p.setFont("Helvetica-Bold", 8)
    p.drawString(50, y + 5, "AUTOMATED UNDERWRITING ENGINE")
    p.setFont("Helvetica", 7.5)
    p.drawString(50, y - 6, f"Cryptographic SHA-256 Stamp: {hex(abs(hash(applicant_name + issue_date)))[2:14].upper()}")

    # Right Signature
    p.line(width - 200, y + 16, width - 50, y + 16)
    p.setFont("Helvetica-Bold", 8)
    p.drawString(width - 200, y + 5, "CONSORTIUM CLEARINGHOUSE OFFICER")
    p.setFont("Helvetica", 7.5)
    p.drawString(width - 200, y - 6, "Authorized Clearinghouse Signatory")

    # Center Verified Seal Stamp
    p.setStrokeColor(colors.HexColor("#064e3b"))
    p.setLineWidth(1.5)
    p.rect(width / 2 - 60, y - 10, 120, 36, fill=0, stroke=1)
    p.setFillColor(colors.HexColor("#064e3b"))
    p.setFont("Helvetica-Bold", 8)
    p.drawCentredString(width / 2, y + 12, "DIGITALLY VERIFIED")
    p.setFont("Helvetica", 7)
    p.drawCentredString(width / 2, y + 1, "RBI DLRE PROTOCOL")
    p.drawCentredString(width / 2, y - 7, "100% TAMPER-PROOF")

    # 8. Bottom Footer
    p.setStrokeColor(colors.black)
    p.setLineWidth(1)
    p.line(40, 32, width - 40, 32)
    p.setFillColor(colors.HexColor("#555555"))
    p.setFont("Helvetica", 7)
    p.drawString(40, 20, "SmartLoan AI Consortium Inc. • RBI NBFC-P2P Aggregator Protocol • Regulated Entity Clearinghouse Ledger")
    p.drawRightString(width - 40, 20, "Page 1 of 1 • System Generated Sanction")

    p.save()
    buffer.seek(0)
    return buffer.getvalue()
