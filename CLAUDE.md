# FamilyCare App — Claude Code Project Context

## Sister Repository
This project works together with the **familycare** repository which 
contains all Supabase database migrations, seed data, and n8n workflow 
configurations. Both repos are part of the same application.

- familycare-app → Frontend (this repo)
- familycare → Database + Backend automation

When making schema changes, always update the familycare repo first,
then build the frontend feature here.

---

## What FamilyCare Is
FamilyCare is a patient-first family health management web application
built for Indian families. It solves a real gap — when someone in the
family is diagnosed with a critical illness, there is no single place
to manage their medical history, find specialists, or get a second
opinion.

## Target Users
Indian families — primarily on Android mobile devices. The app must
work well on both mobile and desktop from day one.

## Business Model
- Free forever for patients and families
- Doctors, hospitals, and specialists pay for:
  - Listing fees (Phase 2)
  - Per-consultation platform cut (Phase 2)
  - Featured placement for specific conditions (Phase 2)
- Pharma and research orgs pay for anonymised aggregated data (Phase 3)
- Built to generate revenue post-retirement — part-time managed

---

## Product Roadmap

### Phase 1 — Family Medical Vault (Months 1–6)
**Goal:** A working app where families store and manage health records

Features:
1. Family profile management — add members, age, blood group, conditions
2. Document vault — upload prescriptions, reports, scans (PDF/image)
3. Medical timeline — chronological view of health events per member
4. Secure share link — one-tap shareable summary for doctor visits
5. Medication tracker — current medications with dosage and reminders
6. Basic alerts — prescription renewal reminders, follow-up nudges
7. Structured diagnosis tagging — ICD-10 condition search dropdown
8. Report-to-condition linking — every report tagged to a condition
9. Second Opinion placeholder button — greyed out, logs interest

### Phase 2 — Second Opinion Engine (Months 7–15)
**Goal:** Connect patients with verified specialists pan-India

The Second Opinion Engine flow:
1. Patient uploads report + tags condition
2. AI summarises report in plain language (Claude API)
3. Generates 5 smart questions to ask any doctor
4. Matches to 2-3 verified specialists by condition
5. Patient requests async second opinion (voice/document/video)
6. Specialist responds within 48 hours
7. Specialist gets paid — platform takes 15-20% cut

Features:
- Specialist listing and onboarding
- Critical illness content library (global research summaries)
- Async second opinion request and response flow
- Specialist search by condition (ICD-10 based)
- Appointment booking with doctors
- Post-operative therapist engagement
- NGO and financial support institution directory

Revenue unlock:
- Specialist listing fee: ₹2,000–5,000/month
- Per-consultation platform cut: 15–20%
- Hospital partnerships for featured specialists

### Phase 3 — Full Care Ecosystem (Months 16–24)
**Goal:** Complete care coordination platform

Features:
- Appointments with doctors and specialists
- Post-operative therapist booking
- NGO / financial support institution connections
- Emotional support network
- Anonymised condition data marketplace (with consent)
- Pan-India hospital and clinic network

---

## The Wild Feature — Second Opinion Engine (Phase 2)

This is the product's most powerful differentiator. Key insight:
When an Indian family gets a critical diagnosis (cancer, rare disease),
they don't know which questions to ask, which doctor to trust, or how
to interpret reports. No one is solving this well in India.

Phase 1 seeds this engine with:
- Structured ICD-10 condition tagging on every record
- Report-to-condition linking (phase2_ready flag on documents)
- Interest signals table logging every "Find Second Opinion" tap
- second_opinion_requested flag on medical_conditions table
- Weekly founder digest showing top conditions people want opinions on

Phase 2 builds the full engine on top of this data foundation.

---

## Tech Stack
- Framework: Next.js 14 (App Router) with TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui (Nova preset — Radix + Lucide + Geist)
- Database: Supabase (PostgreSQL) with Row Level Security
- Auth: Supabase Auth — OTP based
  - Development: Email OTP → check Inbucket at localhost:54324
  - Production: Phone OTP → MSG91 WhatsApp API
- Icons: Lucide React
- Forms: React Hook Form + Zod (planned)
- Notifications: n8n + MSG91 (Week 9 onwards)
- Hosting: Vercel (free tier)

---

## Project Structure
familycare-app/
├── CLAUDE.md                    ← you are here
├── middleware.ts                ← auth session management
├── src/
│   ├── app/
│   │   ├── (auth)/              ← unauthenticated screens
│   │   │   ├── login/           ← mobile/email entry
│   │   │   ├── verify/          ← OTP verification
│   │   │   └── onboarding/      ← new user setup (2 steps)
│   │   └── (dashboard)/         ← authenticated screens
│   │       ├── dashboard/       ← family overview
│   │       ├── members/         ← family member list + add
│   │       ├── members/[id]/    ← individual member profile
│   │       ├── documents/       ← document vault
│   │       ├── medications/     ← medication tracker
│   │       └── timeline/        ← medical event timeline
│   ├── components/
│   │   ├── ui/                  ← shadcn/ui components
│   │   ├── layout/              ← navigation, sidebar, header
│   │   ├── members/             ← family member components
│   │   ├── documents/           ← document vault components
│   │   ├── medications/         ← medication tracker components
│   │   └── conditions/          ← medical condition components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        ← browser client
│   │   │   ├── server.ts        ← server client
│   │   │   └── middleware.ts    ← session updater
│   │   ├── user.ts              ← user profile helpers
│   │   └── onboarding.ts        ← onboarding data functions
│   ├── hooks/                   ← custom React hooks
│   └── types/
│       └── database.ts          ← TypeScript types for all DB tables


---

## Database Tables (in familycare repo)
All tables have RLS enabled. Users only see their own family data.

| Table | Purpose |
|---|---|
| users | Authenticated users linked to Supabase Auth |
| family_groups | One per user, container for the family |
| family_members | Each person in the family |
| icd10_conditions | Reference — 84 curated conditions for India |
| medical_conditions | Diagnosed conditions per family member |
| documents | Prescriptions, reports, scans |
| medications | Current and past medications |
| medication_logs | Reminder acknowledgement tracking |
| medical_events | Health timeline — visits, surgeries, tests |
| share_links | Secure time-limited doctor share links |
| interest_signals | Phase 2 seed — second opinion interest tracking |

## Database Helper Functions
- has_completed_onboarding(user_auth_id) → boolean
- get_current_user_profile() → json
- get_due_medication_reminders() → table (for n8n)
- get_due_followups() → table (for n8n)
- get_pending_interest_signals() → table (for n8n)
- deactivate_expired_share_links() → void (for n8n)

---

## Auth Flow
User enters email (dev) or mobile number (prod)
↓
OTP sent → verify page
↓
Supabase Auth creates user
↓
DB trigger (handle_new_user) auto-creates:
→ public.users record
→ public.family_groups record
↓
has_completed_onboarding() checked
↓
false → /onboarding    true → /dashboard
↓
Step 1: Full name, mobile, city, state
Step 2: DOB, gender, blood group
↓
family_members record created (relation=self, is_primary=true)
↓
/dashboard

---

## Environment Variables
NEXT_PUBLIC_SUPABASE_URL       local: http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY  from supabase status
NEXT_PUBLIC_APP_NAME           FamilyCare
NEXT_PUBLIC_APP_ENV            development | staging | production

USE_PHONE_AUTH constant in auth pages:
- false when APP_ENV = development (uses email OTP)
- true when APP_ENV = production (uses phone OTP)

---

## GitHub Branch Strategy

### Branch Structure
main       ← production only, protected, never push directly
staging    ← pre-release testing
dev        ← active development base, default branch
feature/   ← individual feature branches

### Branch Naming Convention
feature/ph1-auth-trigger
feature/ph1-dashboard-layout
feature/ph1-family-dashboard
feature/ph1-member-profile
feature/ph1-document-vault
feature/ph1-medications
feature/ph1-timeline
feature/ph1-share-links
feature/ph1-second-opinion
feature/ph2-specialist-listing    ← Phase 2 example

### Standard Flow for Every Feature
git checkout dev && git pull origin dev
git checkout -b feature/ph1-FEATURENAME
Build the feature
git add . && git commit -m "feat: description"
git push origin feature/ph1-FEATURENAME
GitHub → New PR → feature branch → dev
When ready: PR → dev → staging
When confirmed: PR → staging → main

### Commit Message Convention
feat:      new feature or screen
fix:       bug fix
chore:     setup, config, dependencies
docs:      documentation updates
style:     UI/styling changes only
refactor:  code restructure, no feature change

### Examples
feat: add family dashboard with member cards
feat: add document upload to document vault
fix: fix OTP redirect after verification
chore: update Supabase client to latest
style: improve mobile layout on member profile

---

## Current Development Status

### Completed ✅
- Dev/staging/prod environment setup
- 13 database migrations with full RLS
- 84 ICD-10 conditions seeded
- Auth trigger — auto-creates user + family group on signup
- Login page — email OTP (dev) / phone OTP (prod)
- OTP verify page — 6-box input with auto-focus
- Onboarding page — 2 step flow (personal + health details)
- Dashboard placeholder page
- Family profile management — add/edit family members
- Medical conditions tagging with ICD-10


### In Progress 🔄
- Onboarding flow testing and bug fixes
- Document Vault — file upload to Supabase Storage

### Up Next (in priority order) ⏳
1. Fix onboarding build error (user.ts export)
2. Dashboard layout shell — navigation, sidebar, header
3. Screen 2 — Family dashboard (member list + add member)
4. Screen 3 — Member profile + conditions + documents
5. Document vault — file upload to Supabase Storage
6. Medication tracker — add, edit, reminder toggle
7. Medical timeline — chronological event view
8. Secure share link — generate and send to doctor
9. Second Opinion placeholder button — logs interest signal
10. PWA setup — mobile home screen install
11. Vercel deployment setup
12. Doctor waitlist landing page

---

## Key Design Decisions — Do Not Change Without Discussion
- Soft deletes everywhere — use deleted_at, never hard delete rows
- RLS on every table — never bypass with service role in frontend
- ICD-10 structured tagging — always link conditions to icd10_conditions
- Phase 2 seeds — second_opinion_requested and phase2_ready columns
  exist now and must be set correctly even in Phase 1
- Indian mobile numbers only — always prefix +91
- Tailwind + shadcn/ui only — no other CSS frameworks
- No direct DB schema changes — all changes via migration files
  in the familycare repo