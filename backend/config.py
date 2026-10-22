import os
from pathlib import Path
from dotenv import load_dotenv

# Compatibility patch for bcrypt 4.1+/5.0+ with passlib 1.7.4 on modern Python
try:
    import bcrypt
    if not hasattr(bcrypt, "__about__"):
        bcrypt.__about__ = type("about", (), {"__version__": getattr(bcrypt, "__version__", "4.0.0")})
    _orig_hashpw = bcrypt.hashpw
    def _safe_hashpw(password, salt):
        if isinstance(password, (bytes, bytearray)) and len(password) > 72:
            password = password[:72]
        elif isinstance(password, str) and len(password.encode("utf-8")) > 72:
            password = password.encode("utf-8")[:72]
        return _orig_hashpw(password, salt)
    bcrypt.hashpw = _safe_hashpw
except Exception:
    pass

# Define root and load environment variables

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

# Document uploads configuration
UPLOAD_DIR = PROJECT_ROOT / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_UPLOAD_BYTES = int(os.getenv("SMARTLOAN_MAX_UPLOAD_BYTES", 10 * 1024 * 1024))  # 10 MB default

# Database configuration
DATABASE_URL = os.getenv("SMARTLOAN_DATABASE_URL", f"sqlite:///{PROJECT_ROOT}/smartloan.db")

# JWT authentication configuration
JWT_SECRET = os.getenv("SMARTLOAN_JWT_SECRET", "smartloan-ai-college-secret-key-2026-secure")
JWT_ALGORITHM = os.getenv("SMARTLOAN_JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.getenv("SMARTLOAN_JWT_EXPIRATION_MINUTES", "1440"))

# Demo mode & seeds
DEMO_OTP_ENABLED = os.getenv("SMARTLOAN_DEMO_OTP_ENABLED", "true").lower() == "true"
BANK_DEMO_PASSWORD = os.getenv("SMARTLOAN_BANK_DEMO_PASSWORD", "bank-demo123")
