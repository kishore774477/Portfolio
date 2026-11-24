import smtplib
from email.mime.text import MIMEText

from app.config import (
    CONTACT_TO_EMAIL,
    EMAIL_ENABLED,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USER,
)


def send_contact_notification(name: str, email: str, subject: str, message: str) -> bool:
    """Send an email notification for a contact form submission.

    Returns False (without raising) when SMTP isn't configured, so the API keeps
    working and storing submissions even with no credentials set.
    """
    if not EMAIL_ENABLED:
        return False

    body = f"From: {name} <{email}>\n\n{message}"
    mime = MIMEText(body, "plain", "utf-8")
    mime["Subject"] = f"[Portfolio Contact] {subject}"
    mime["From"] = SMTP_USER
    mime["To"] = CONTACT_TO_EMAIL
    mime["Reply-To"] = email

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, [CONTACT_TO_EMAIL], mime.as_string())
        return True
    except Exception:
        return False
