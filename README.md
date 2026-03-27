# ApplyFlow

ApplyFlow is a full-stack web application that turns your job-search emails into an actionable application pipeline.
It connects Gmail inboxes, automatically finds application-related emails, classifies them (Applied, Interview, Rejected, Offer), and presents everything on a Kanban board you can drag-and-drop and edit.

## What it does

1. Connect accounts (Google OAuth)
2. Sync emails from the last 30 days (Gmail readonly)
3. Filter for job application signals using keyword rules
4. Classify each message into one of:
   - `APPLIED`
   - `INTERVIEW`
   - `REJECTED`
   - `OFFER`
5. Persist results to PostgreSQL (via Prisma)
6. Display and manage your pipeline in a Kanban UI (drag-and-drop + inline editing)

## Why it stands out (recruiter-friendly)

- **End-to-end engineering**: Next.js (App Router) frontend + API routes + Prisma data layer + email provider integrations.
- **Production-minded security**:
  - OAuth access/refresh tokens are **encrypted at rest** before saving.
  - Data access is scoped to the authenticated user.
- **Automation with control**: classification is deterministic (keyword-driven) and reversible via UI edits + drag-and-drop.
- **Clear separation of concerns**:
  - Provider-specific email fetching is isolated (`src/lib/email/providers/*`)
  - Classification logic is isolated (`src/lib/emailClassifier.ts`)
  - Kanban board uses a clean `/api/applications` contract.

## Demo routes

- Marketing / landing: `/landing`
- Authenticated app: `/dashboard`
- Connected accounts: `/accounts`
- Settings: `/settings`

## Tech stack

- **Frontend**: Next.js (App Router), TailwindCSS
- **Auth**: Auth.js / NextAuth (Google OAuth)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Email integrations**:
  - Gmail API (`gmail.readonly`)

## Core features by requirement

- Google OAuth
- Stores connected account info in `ConnectedAccount`
- Encrypted token storage via `src/lib/encryption.ts`

- Fetches messages from the last **30 days**
- Extracts subject/body/from for keyword matching
- Uses keyword filter rules + classification into pipeline stages

### Database schema (Prisma)
- `User`
- `ConnectedAccount`
- `Application` (Kanban cards)

### Kanban dashboard UI
- Columns: Applied, Interview, Rejected, Offer
- Drag-and-drop updates status
- Inline edits for `company` and `role`

## API routes

Backend endpoints implemented:
- `GET/POST/PATCH /api/applications`
- `DELETE /api/applications/[id]`
- `POST /api/sync-emails`
- `GET /api/connect/google`
- `GET/POST /api/auth/[...nextauth]` (NextAuth handler)

## Local setup

### 1) Prerequisites
- Node.js
- PostgreSQL running locally

### 2) Environment variables

Create a `.env` file with:

```env
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASS@localhost:5432/applyflow?schema=public"

ENCRYPTION_KEY="BASE64_32_BYTE_KEY"
NEXTAUTH_SECRET="SOME_LONG_RANDOM_STRING"

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

Notes:
- `ENCRYPTION_KEY` must be base64 for a 32-byte key.

### 3) Database migration

```bash
npx prisma migrate dev --name init
```

### 4) Run the app

```bash
npm run dev
```

Then visit:
- `http://localhost:3000/landing`
- `http://localhost:3000/accounts` to connect inboxes
- `http://localhost:3000/dashboard` to sync and manage the pipeline

## How to evaluate quickly

1. Connect **Gmail**
2. Click **Sync emails**
3. Verify that emails containing phrases like:
   - “application received”
   - “thank you for applying”
   - “interview”
   - “we regret to inform you”
   are classified into the correct Kanban columns

## Roadmap (if you want to extend it)

- Improve email parsing (HTML stripping, better thread correlation)
- Add more robust role/company inference
- Support manual “review” queue before auto-classification lands in the board
- Add a bulk “reclassify” action and reconciliation against previous runs

