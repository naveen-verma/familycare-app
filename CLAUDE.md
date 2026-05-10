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

## Current Status — Week 15 Soft Launch ✅

### Live URLs
- Production app:  https://familycare-app-ten.vercel.app
- Domain:          familycare.co.in (pending DNS cutover)

### Infrastructure
| Component | Status | Details |
|---|---|---|
| Frontend | ✅ Live | Next.js 14 on Vercel, main branch |
| Supabase Production | ✅ Live | wpmnobisujpswvyzhulj.supabase.co |
| Supabase Staging | ✅ Live | gqxviikkoarijhhqnnlt.supabase.co |
| n8n Production | ✅ Live | Railway production environment |
| n8n Staging | ✅ Live | n8n-staging-staging.up.railway.app |
| WhatsApp | ✅ Live | MSG91, number 919217665889 |
| Email OTP | ✅ Live | Resend SMTP, noreply@familycare.co.in |

### n8n Workflows — Production Status
| Workflow | Purpose | Schedule | Status |
|---|---|---|---|
| WF1 — Medication Reminder | WhatsApp medication alerts | Every hour | ✅ Active |
| WF2 — Document Upload Alert | WhatsApp on new upload | Every 30 min | ✅ Active |
| WF4 — Follow-up Nudge | Daily follow-up reminders | 9am IST daily | ✅ Active |
| WF5 — Diagnosis Enrichment | ICD-10 enrichment | Every 6 hours | ✅ Active |
| WF7 — Interest Signal Tracker | Founder digest | 8am IST daily | ⏳ Deferred |

### Phase 1 Features — Completed ✅
- Auth — Email OTP via Supabase (confirm email OFF, OTP ON)
- Onboarding — 2-step flow, handle_new_user trigger creates
  public.users and family_groups automatically
- Dashboard — Command centre: health alerts, today's medications,
  family snapshot, recent activity, quick actions, Log Visit FAB
- Family management — add/edit members, 2-step progressive form
- Medical conditions — ICD-10 tagging, pin to top
- Document vault — upload, condition linking, filter by type
- Medications — add with time-of-day pickers, reminder toggle
- Medical timeline — collapsible accordion, type filter chips
- Unified doctor visit flow — 5-step sheet (Fix #7)
- Secure share links — generate and send to doctor
- Mobile UI simplification — scannable cards, progressive disclosure
- WhatsApp reminders — WF1 live on production

---

## Product Roadmap

Phase 1 — Family Medical Vault (Months 1–6)      ✅ Complete
Phase 2 — Second Opinion Engine (Months 7–15)    🔜 Next
Phase 3 — Full Care Ecosystem (Months 16–24)     📋 Planned
Phase 4 — IoT & Patient Safety (Months 25–36)    💡 Vision

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

### Phase 4 — IoT & Patient Safety (Months 25–36)
**Goal:** Real-time health monitoring and patient safety
for elderly and chronically ill family members

4.1 Health Device Monitoring — Glucometer, BP Monitor, Oximeter
    via Bluetooth Low Energy → Node-RED on Raspberry Pi
    → n8n WhatsApp alerts on anomalies

4.2 Geofencing for Dementia Patient Safety
    GPS tracker → safe zone boundary check every 5 min
    → WhatsApp alert to all family members on exit

---

## Tech Stack
- Framework: Next.js 14 (App Router) with TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui (Nova preset — Radix + Lucide + Geist)
- Database: Supabase (PostgreSQL) with Row Level Security
- Auth: Supabase Auth — Email OTP
  - Development: Email OTP → check Inbucket at localhost:54324
  - Production: Email OTP (confirm email OFF, OTP ON in Supabase)
- Icons: Lucide React
- Forms: React Hook Form + Zod
- Notifications: n8n + MSG91 WhatsApp API
- Hosting: Vercel (free tier)

---

## Project Structure
familycare-app/
├── CLAUDE.md
├── middleware.ts                ← auth session management
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/           ← email entry + OTP
│   │   │   ├── verify/          ← OTP verification
│   │   │   └── onboarding/      ← new user setup (2 steps)
│   │   └── (dashboard)/
│   │       ├── dashboard/       ← command centre dashboard
│   │       ├── family/          ← family member list
│   │       ├── members/         ← add member
│   │       ├── members/[id]/    ← individual member profile
│   │       ├── documents/       ← document vault
│   │       ├── documents/upload/
│   │       ├── medications/
│   │       ├── medications/add/
│   │       ├── timeline/        ← medical event timeline
│   │       ├── share/           ← secure share links
│   │       └── visits/          ← unified doctor visit flow
│   ├── components/
│   │   ├── ui/                  ← shadcn/ui components
│   │   ├── layout/              ← navigation, sidebar, header
│   │   ├── dashboard/           ← dashboard sections + FAB
│   │   ├── visits/              ← LogVisitSheet (5-step)
│   │   ├── members/
│   │   ├── documents/
│   │   ├── medications/
│   │   └── conditions/
│   ├── hooks/
│   │   └── useDashboardData.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── user.ts
│   │   └── onboarding.ts
│   └── types/
│       └── database.ts

---

## Database Tables (defined in familycare repo)
All tables have RLS enabled. Users only see their own family data.

| Table | Purpose |
|---|---|
| users | Authenticated users, supabase_auth_id FK to auth |
| family_groups | One per user, group_name column |
| family_members | Each person — full_name column (not name) |
| icd10_conditions | 84 curated conditions for India |
| medical_conditions | Diagnosed conditions per family member |
| condition_consultations | Doctor visits linked to conditions |
| documents | Prescriptions, reports, scans |
| medications | Current and past medications |
| medication_logs | Reminder acknowledgement tracking |
| medical_events | Health timeline — visits, surgeries, tests |
| share_links | Secure time-limited doctor share links |
| interest_signals | Phase 2 seed — second opinion interest |

## Critical Column Names — Do Not Confuse
- family_members.full_name  (NOT name)
- family_groups.group_name  (NOT name)
- medications.name          (NOT medication_name)
- users.supabase_auth_id    (FK to auth.users.id)
- users.id                  (internal PK — different from auth uuid)

## Critical CHECK Constraints — Values Must Match Exactly
medications.frequency — ALL LOWERCASE:
  'once daily' | 'twice daily' | 'three times daily' |
  'four times daily' | 'every alternate day' |
  'weekly' | 'as needed' | 'other'

condition_consultations.consultation_type — ALL LOWERCASE:
  'visit' | 'surgery' | 'test' | 'vaccination' |
  'hospitalization' | 'therapy' | 'other'
  Note: American spelling — hospitalization (z not s)

medical_conditions.status — ALL LOWERCASE:
  'active' | 'resolved' | 'chronic' | 'monitoring'

## Database Helper Functions
- has_completed_onboarding(user_auth_id) → boolean
- get_current_user_profile() → json
- get_due_medication_reminders() → table (for WF1)
- get_due_followups() → table (for WF4)
- get_unenriched_conditions() → table (for WF5)
- get_pending_interest_signals() → table (for WF7)
- deactivate_expired_share_links() → void

---

## Auth Flow
User enters email
↓
OTP sent → verify page
↓
Supabase Auth creates auth.users row
↓
DB trigger (handle_new_user) auto-creates:
→ public.users record (supabase_auth_id = auth uuid)
→ public.family_groups record (owner_id = public.users.id)
↓
has_completed_onboarding() checked
↓
false → /onboarding    true → /dashboard
↓
Step 1: Full name, mobile, city, state
Step 2: DOB, gender, blood group, height, weight
↓
family_members record created (relation=self, is_primary=true)
↓
/dashboard

## CRITICAL: User ID Mapping
auth.users.id                 ← Supabase auth UUID (from session)
public.users.id               ← Internal PK (different UUID)
public.users.supabase_auth_id = auth.users.id

Always look up public.users WHERE supabase_auth_id = auth uuid,
then use public.users.id for all other table joins.
Never use auth uuid directly against family_groups.owner_id
or any other public schema table.

---

## Supabase Auth Settings — Verify After Every Deploy
Go to: Authentication → Sign In / Providers

  ✅ Enable Email provider     ON
  ❌ Confirm email             OFF  ← resets after db push, always check
  ✅ Email OTP                 ON
     OTP Expiry:               600 seconds

Go to: Authentication → URL Configuration
  Site URL:      https://familycare-app-ten.vercel.app
  Redirect URLs: https://familycare-app-ten.vercel.app/**

Apply to BOTH staging and production Supabase instances.

---

## Environment Variables
NEXT_PUBLIC_SUPABASE_URL       local: http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY  from supabase status
NEXT_PUBLIC_APP_NAME           FamilyCare
NEXT_PUBLIC_APP_ENV            development | staging | production

---

## GitHub Branch Strategy

### Branch Structure
main       ← production only, protected, NEVER push directly
staging    ← pre-release testing
dev        ← active development base, default branch
feature/   ← one branch per feature or fix
hotfix/    ← urgent production fixes only

### MANDATORY Development Flow — Follow Every Time
Claude Code MUST follow this exact sequence for every change.
Never skip steps. Never push directly to staging or main.

Step 1 — Create feature branch from dev
  git checkout dev
  git pull origin dev
  git checkout -b feature/ph[N]-description
  git push -u origin feature/ph[N]-description

Step 2 — Build and test locally
  npm run dev
  Test at localhost:3000
  npm run build   ← must pass with zero errors before proceeding

Step 3 — Commit
  git add .
  git commit -m "[type]: description"
  git push origin feature/ph[N]-description

Step 4 — Merge feature → dev
  git checkout dev
  git pull origin dev
  git merge feature/ph[N]-description --no-ff \
    -m "merge: feature/ph[N]-description into dev"
  git push origin dev

Step 5 — Merge dev → staging
  git checkout staging
  git pull origin staging
  git merge dev --no-ff \
    -m "merge: dev into staging — [description]"
  git push origin staging
  Verify on Vercel staging preview URL before proceeding

Step 6 — Merge staging → main (production)
  ONLY after staging verification passes
  git checkout main
  git pull origin main
  git merge staging --no-ff \
    -m "release: [version] — [description]"
  git push origin main
  git tag -a v[X.Y.Z] -m "[release description]"
  git push origin v[X.Y.Z]

### Hotfix Flow (urgent production bugs only)
  git checkout dev && git pull origin dev
  git checkout -b hotfix/description
  [fix the bug]
  git commit -m "fix: description"
  git push origin hotfix/description
  Then follow same merge sequence: hotfix → dev → staging → main

### Branch Naming
feature/ph1-dashboard-redesign
feature/ph2-specialist-listing
hotfix/ph1-mobile-logout

### Commit Convention
feat:      new feature
fix:       bug fix
hotfix:    urgent production fix
chore:     config, dependencies
docs:      documentation
style:     UI/styling only
refactor:  restructure, no behaviour change
schema:    database migration
merge:     branch merge
release:   production release

### NEVER Do These
- Never push directly to main or staging
- Never skip the dev → staging → main sequence
- Never merge without npm run build passing with zero errors
- Never use $vars. in n8n (Enterprise feature, not available)
- Never hardcode staging credentials in production configs

---

## Key Design Decisions — Do Not Change Without Discussion
- Soft deletes everywhere — deleted_at, never hard delete
- RLS on every table — never bypass with service role in frontend
- ICD-10 structured tagging — always link to icd10_conditions
- Phase 2 seeds — second_opinion_requested and phase2_ready
  must be set correctly even in Phase 1
- Indian mobile numbers — always prefix +91
- Tailwind + shadcn/ui only — no other CSS frameworks
- No direct DB schema changes — migration files in familycare repo only
- family_members.full_name — always full_name, never name
- medications.frequency — always lowercase to match CHECK constraint
- reminder_enabled — defaults to true (opt-out, not opt-in)
- Mobile-first — always test at 375px before desktop

---

## Post-Deployment Checklist
Run after every push to staging or production:

### Supabase Auth
  ❌ Confirm email     must be OFF (resets to ON after db push)
  ✅ Email OTP         must be ON
  ✅ Site URL          https://familycare-app-ten.vercel.app

### New User Signup Test
  □ Fresh email → 6-digit OTP received (not a confirmation link)
  □ Onboarding Step 1 completes without error
  □ Onboarding Step 2 — no "Family group not found" error
  □ Dashboard loads correctly after onboarding

### Vercel Deployment
  □ Deployment status green in Vercel dashboard
  □ No TypeScript or build errors in deployment logs

### n8n Workflows (production)
  □ WF1 Active toggle ON
  □ WF2 Active toggle ON
  □ WF4 Active toggle ON
  □ WF5 Active toggle ON

---

## Planned — Phase 1 (Not Yet Built)

### AI Document Extraction
When to build: alongside or after Document Vault
How: Claude API (claude-sonnet-4-20250514) reads uploaded
image/PDF → extracts doctor name, condition, medications, date
→ pre-fills Add Condition form → user reviews before saving
Never auto-save extracted data.

### WF7 — Interest Signal Tracker
Status: Deferred — needs a new MSG91 WhatsApp template
Current familycare_share_link template variables do not suit
a founder digest. Create new template first.
Recipient: founder mobile 9810652710
Purpose: daily digest of second opinion interest signals
