# Portfolio API

FastAPI backend for the contact form on [kishore774477.github.io](https://kishore774477.github.io). Replaces the third-party `formsubmit.co` dependency with a self-hosted endpoint that stores every submission and optionally emails a notification.

## Endpoints

- `GET /health` — liveness check.
- `POST /api/contact` — `{name, email, subject, message}` → stores the message in SQLite and emails it if SMTP is configured. Rate-limited to 5 requests/minute per IP.

## Run locally

```
start.bat
```

Creates `.venv`, installs dependencies, and starts the API on `http://localhost:8220`. Works out of the box with no configuration — submissions are saved to `contact.db`, email sending is skipped until SMTP is set up.

## Enable real email delivery

Copy `.env.example` to `.env` and fill in SMTP credentials (a Gmail [app password](https://myaccount.google.com/apppasswords) works well). Without this, the API still accepts and stores submissions.

## Deploy

`render.yaml` deploys this as a free Render web service. Push the repo, create a new Blueprint on [Render](https://render.com) pointing at this repo/`backend` directory, and set the `SMTP_*` secrets in the dashboard. Update `assets/js/motion-engine.js`'s `API_BASE` (or set it via `window.PORTFOLIO_API_BASE` before the script loads) to the deployed URL.
