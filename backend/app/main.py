import secrets
import time
from collections import defaultdict, deque
from typing import List

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import (
    ADMIN_TOKEN,
    ALLOWED_ORIGINS,
    RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_SECONDS,
)
from app.database import Base, engine, get_db
from app.email_utils import send_contact_notification
from app.models import Article, ContactMessage
from app.schemas import ArticleCreate, ArticleOut, ContactCreate, ContactOut

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


def _article_out(record: Article) -> ArticleOut:
    stack = [s.strip() for s in record.stack.split(",") if s.strip()] if record.stack else []
    return ArticleOut(
        id=record.id,
        title=record.title,
        tag=record.tag,
        read_time=record.read_time,
        excerpt=record.excerpt,
        content=record.content,
        stack=stack,
        created_at=record.created_at,
    )


@app.get("/api/articles", response_model=List[ArticleOut])
def list_articles(db: Session = Depends(get_db)):
    records = db.query(Article).order_by(Article.created_at.desc()).all()
    return [_article_out(r) for r in records]


@app.post("/api/articles", response_model=ArticleOut)
def create_article(
    payload: ArticleCreate,
    request: Request,
    db: Session = Depends(get_db),
    x_admin_token: str = Header(default=""),
):
    _rate_limit(request)

    if not secrets.compare_digest(x_admin_token, ADMIN_TOKEN):
        raise HTTPException(status_code=401, detail="Invalid admin token")

    record = Article(
        title=payload.title,
        tag=payload.tag,
        read_time=payload.read_time,
        excerpt=payload.excerpt,
        content=payload.content,
        stack=", ".join(s.strip() for s in payload.stack if s.strip()),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return _article_out(record)
