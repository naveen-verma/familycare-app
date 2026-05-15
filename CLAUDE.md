# FamilyCare App — Claude Code Project Context

## Sister Repository
This project works together with the **familycare** repository
which contains all Supabase database migrations, seed data,
and n8n workflow configurations.

- familycare-app → Frontend (this repo)
- familycare → Database + Backend automation

Always make schema changes in familycare repo first, then
build frontend features here.

---

## What FamilyCare Is
Patient-first family health management web app for Indian
families. One place to store, manage and share your entire
family's medical history.

## Target Users
Indian families — primarily Android mobile. Must work on
both mobile and desktop.

## Live URLs
- Production:  https://familycare.co.in  (custom domain ✅)
- Vercel URL:  https://familycare-app-ten.vercel.app
- Staging:     Vercel preview on staging branch

---

## Current Status — v1.5.4 Post Soft Launch

### Infrastructure
| Component | Status | Details |
|---|---|---|
| Frontend | ✅ Live | Next.js 14, Vercel, main branch |
| Custom domain | ✅ Live | familycare.co.in → Vercel |
| Supabase Production | ✅ Live | wpmnobisujpswvyzhulj.supabase.co |
| Supabase Staging | ✅ Live | gqxviikkoarijhhqnnlt.supabase.co |
| n8n Production | ✅ Live | Railway production environment |
| n8n Staging | ✅ Live | n8n-staging-staging.up.railway.app |
| WhatsApp | ✅ Live | MSG91, number 919217665889 |
| Email OTP | ✅ Live | Resend, noreply@familycare.co.in |
| Google SSO | ✅ Live | Supabase OAuth, Google Cloud Console |

### Auth Methods
1. Google SSO — primary, one tap login
2. Email OTP — secondary, 6-digit code

### n8n Workflows
| Workflow | Purpose | Schedule | Status |
|---|---|---|---|
| WF1 — Medication Reminder | WhatsApp medication alerts | Hourly | ✅ Active |
| WF2 — Document Upload Alert | WhatsApp on new upload | 30 min | ✅ Active |
| WF4 — Follow-up Nudge | Daily follow-up reminders | 9am IST | ✅ Active |
| WF5 — Diagnosis Enrichment | ICD-10 enrichment | 6 hours | ✅ Active |
| WF7 — Interest Signal Tracker | Founder digest | 8am IST | ⏳ Deferred |

---

## Version History

### v1.0.0 — Phase 1 Initial Launch
- Auth, onboarding, family management
- Medical conditions, documents, medications
- Document vault, timeline, secure share links

### v1.1.0 — Week 15 Soft Launch Fixes
- Fix #3: Dashboard command centre redesign
- Fix #7: Unified doctor visit flow (5-step sheet)
- Fix #2: Mobile UI simplification
- Hotfix: mobile logout

### v1.2.x — Hotfixes Post Soft Launch
- v1.2.1: Auth trigger exception handling
- v1.2.2: Expired medications hidden from dashboard
- v1.2.3: Deactivate expired medications migration
- v1.2.4: Medication reminders per member mobile number

### v1.3.0 — Google SSO
- Google OAuth login added as primary sign-in
- Email OTP kept as secondary option
- /auth/callback route handler created

### v1.3.1 — Google SSO Fixes
- OAuth redirect stays on correct domain
- Greeting shows real name from Google metadata
- handle_new_user reads 'name' key from Google

### v1.4.x — Dashboard + Member Profile Polish
- v1.4.0: Family health tabbed section on dashboard
- v1.4.1–v1.4.3: Tab bar inside card, timeline, greeting
- v1.4.4–v1.4.7: Member profile UI polish
  · Condition rows use dividers not nested cards
  · Status group labels sentence case
  · Visit badge teal colour
  · Empty accordion sections: icon + message, no button
  · Phase 2 features (Find Second Opinion) hidden
  · Closed accordions have border on all sides
  · Critical badge style consistent
  · Add medication button removed from accordion

### v1.5.x — Horizontal Timeline Redesign
- v1.5.0: Full horizontal timeline with year rows + event pills
- v1.5.1: Month drill-down panel with card border
- v1.5.2: All family members in member switcher
- v1.5.3: Document title field fix
- v1.5.4: Stem line stretches full year row height

---

## Phase 1.5 — Next (Planned)
- Profile pictures for family members
  · Requires: avatar_url column on family_members
  · Requires: Supabase Storage bucket member-avatars
  · Upload UI on member edit page
- AI document extraction (scan to auto-fill)
  · Claude API reads uploaded prescription/report
  · Pre-fills Add Condition form
  · User reviews before saving — never auto-save
- WF7 — Interest Signal Tracker
  · Needs new MSG91 WhatsApp template for founder digest
  · Current familycare_share_link template not suitable

## Phase 2 — Second Opinion Engine (Months 7–15)
- Specialist directory and listing
- Async second opinion request/response flow
- Claude API health summary generation
- Specialist search by ICD-10 condition
- Revenue: listing fees + per-consultation cut

## Phase 3 — Full Care Ecosystem (Months 16–24)
- Appointments, therapist booking, NGO directory
- Anonymised condition data marketplace

## Phase 4 — IoT + Patient Safety (Months 25–36)
- Glucometer, BP monitor, oximeter via BLE
- Geofencing for dementia patients
- Node-RED + Raspberry Pi OR smartphone-native
  sensing (evaluate YOU(th)-style approach)

---

## Tech Stack
- Framework: Next.js 14 (App Router) with TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui
- Database: Supabase (PostgreSQL) with RLS
- Auth: Supabase Auth — Google SSO + Email OTP
  - Confirm email: OFF
  - OTP expiry: 600 seconds
- Icons: Lucide React
- Notifications: n8n + MSG91 WhatsApp API
- Hosting: Vercel

---

## Project Structure
familycare-app/
├── CLAUDE.md
├── middleware.ts
├── src/
│   ├── app/
│   │   ├── auth/callback/route.ts   ← Google OAuth handler
│   │   ├── (auth)/
│   │   │   ├── login/               ← Google SSO + OTP
│   │   │   └── onboarding/          ← 2-step new user setup
│   │   └── (dashboard)/
│   │       ├── dashboard/           ← command centre
│   │       ├── family/              ← member list
│   │       ├── members/[id]/        ← member profile
│   │       ├── documents/           ← document vault
│   │       ├── documents/upload/
│   │       ├── medications/
│   │       ├── medications/add/
│   │       ├── timeline/            ← horizontal timeline
│   │       ├── share/
│   │       └── visits/              ← doctor visit flow
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── FamilyHealthTabs.tsx ← new tabbed section
│   │   │   ├── TodaysMedications.tsx
│   │   │   ├── HealthAlertsSection.tsx
│   │   │   ├── QuickActionsBar.tsx
│   │   │   └── DoctorVisitFAB.tsx
│   │   ├── visits/
│   │   │   └── LogVisitSheet.tsx    ← 5-step sheet
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
│   │   └── auth.ts                  ← signInWithGoogle()
│   └── types/
│       └── database.ts

---

## Database Tables
All tables have RLS. Users see only their own family data.

| Table | Purpose |
|---|---|
| users | Auth users, supabase_auth_id FK |
| family_groups | One per user, group_name column |
| family_members | full_name column (NOT name) |
| icd10_conditions | 84 curated conditions |
| medical_conditions | Diagnosed conditions |
| condition_consultations | Doctor visits |
| documents | Prescriptions, reports, scans |
| medications | Current and past medications |
| medication_logs | Reminder tracking |
| medical_events | Health timeline events |
| share_links | Secure doctor share links |
| interest_signals | Phase 2 seed d