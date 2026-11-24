import time
from collections import defaultdict, deque

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import (
    ALLOWED_ORIGINS,
    RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_SECONDS,
)
from app.database import Base, engine, get_db
from app.email_utils import send_contact_notification
from app.models import ContactMessage
from app.schemas import ContactCreate, ContactOut

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Portfolio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

_submission_log: dict[str, deque] = defaultdict(deque)


def _rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = _submission_log[client_ip]
    while window and now - window[0] > RATE_LIMIT_WINDOW_SECONDS:
        window.popleft()
    if len(window) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Too many requests, please try again shortly.")
    window.append(now)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/contact", response_model=ContactOut)
def submit_contact(payload: ContactCreate, request: Request, db: Session = Depends(get_db)):
    _rate_limit(request)

    sent = send_contact_notification(
        name=payload.name,
        email=payload.email,
        subject=payload.subject,
        message=payload.message,
    )

    record = ContactMessage(
        name=payload.name,
        email=payload.email,
        subject=payload.subject,
        message=payload.message,
        email_sent=int(sent),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return ContactOut(ok=True, id=record.id, email_sent=sent)
