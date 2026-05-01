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

Phase 1 — Family Medical Vault (Months 1–6)      ✅ Built
Phase 2 — Second Opinion Engine (Months 7–15)    🔜 Next
Phase 3 — Full Care Ecosystem (Months 16–24)     📋 Planned
Phase 4 — IoT & Patient Safety (Months 25–36)    💡 New

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

### Phase 4 — IoT & Patient Safety (Months 25–36)
**Goal:** Real-time health monitoring and patient safety
for elderly and chronically ill family members

#### 4.1 Health Device Monitoring
Real-time readings from Bluetooth health devices:

- Glucometer (Accu-Chek, OneTouch BLE models)
  → Blood sugar readings auto-logged to timeline
  → Alert family if > 200 mg/dL or < 70 mg/dL
  → Emergency alert if < 50 mg/dL

- BP Monitor (Omron BLE models)
  → Systolic, diastolic, pulse auto-logged
  → Alert if systolic > 140 mmHg
  → Emergency alert if systolic > 180 mmHg

- Pulse Oximeter (any BLE fingertip model)
  → SpO2 + heart rate auto-logged
  → Alert if SpO2 < 94%
  → Emergency alert if SpO2 < 90%

Integration approach:
  Mobile app reads devices via Bluetooth Low Energy
  Node-RED on Raspberry Pi for always-on monitoring
  All readings stored in health_readings table
  n8n triggers WhatsApp alerts on anomalies

#### 4.2 Geofencing for Dementia Patient Safety
Real-time location monitoring for elderly patients
with dementia or Alzheimer's disease.

Context:
  5.3 million dementia patients in India (2020)
  Most cared for at home with no affordable
  monitoring solution — significant unmet need

How it works:
  Family defines safe zone on map
  Patient carries GPS tracker (Jio Tracker ~₹1,999)
  or wears GPS-enabled smartwatch
  Node-RED checks location every 5 minutes
  If patient exits safe zone:
    → Immediate WhatsApp alert to ALL family members
    → Alert includes Google Maps link to last location
    → Alert logged in FamilyCare dashboard
    → Escalating alerts if not acknowledged

Alert format:
  "⚠️ [Patient name] has left the safe zone.
   Last location: [Google Maps link]
   Time: [timestamp]
   Please check on them immediately.
   - FamilyCare Safety Alert"

#### 4.3 New Database Tables (Phase 4)

health_readings:
  id, family_member_id, device_type, reading_type,
  value, unit, recorded_at, source, notes
  device_type: glucometer | bp_monitor | oximeter
  reading_type: blood_sugar | systolic | diastolic |
                pulse | spo2 | heart_rate
  source: manual | bluetooth | iot_hub | node_red

geofence_zones:
  id, family_member_id, zone_name,
  center_lat, center_lng, radius_meters,
  is_active, alert_on_exit, alert_on_entry

location_events:
  id, family_member_id, geofence_zone_id,
  event_type (entered|exited),
  latitude, longitude, recorded_at, alert_sent

#### 4.4 Node-RED Workflows (Phase 4)

WF-IoT-1: Blood Sugar Monitor
  Trigger: New glucometer reading
  Action: Store → threshold check → alert family

WF-IoT-2: BP Monitor
  Trigger: New BP reading
  Action: Store → threshold check → alert family

WF-IoT-3: Oximeter Monitor
  Trigger: New SpO2 reading
  Action: Store → emergency alert if SpO2 < 90%

WF-IoT-4: Geofence Monitor
  Trigger: Every 5 minutes
  Action: Check GPS → compare geofence boundary
          → WhatsApp alert if patient exited

Architecture:
  Raspberry Pi (~₹3,500) installed at home
  Node-RED always running — reads devices
  Sends data to Supabase REST API
  n8n handles alert distribution

#### 4.5 Business Model (Phase 4)

Subscription:
  IoT Plan: ₹499/month per family
  Includes unlimited device readings,
  real-time geofencing, weekly health reports,
  caregiver dashboard, priority support

Hardware (Phase 4+):
  FamilyCare Hub — ₹3,999 one-time
  Pre-configured Raspberry Pi + Node-RED
  Plug and play — no technical setup needed

Enterprise:
  Nursing homes, old age homes, hospitals
  Per-bed pricing model
  EMR system integration

#### 4.6 Grant and Partnership Opportunities

  ARDSI (Alzheimer's and Related Disorders
  Society of India)
  HelpAge India
  NASSCOM Foundation health tech grants
  iSPIRT health stack initiatives
  Startup India health tech scheme

#### 4.7 Phase 4 Prerequisites

Before building:
  1. Complete Phase 2 and Phase 3
  2. Interview 5+ families with diabetic elderly
  3. Interview 3+ families with dementia patients
  4. Validate BLE device compatibility in India
  5. Build Android Bluetooth SDK integration
  6. Prototype Node-RED + Raspberry Pi setup
  7. Test geofencing with Jio Tracker API

Estimated start: Month 25
Target launch:   Month 34-36


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

---

## Planned UX Enhancements — Phase 1

These features are planned but not yet built. Claude Code should be
aware of these when building related features so the foundation is
laid correctly.

---

### 1. AI Document Extraction (Scan to Auto-Fill)

When to build: During or after Document Vault feature
Location: Integrated into document upload flow

How it works:
- User uploads a prescription or report
- Optional button appears: "Extract details with AI"
- Calls Claude API (claude-sonnet-4-20250514) with the uploaded image/PDF
- Claude extracts structured data and pre-fills the Add Condition form
- User reviews all extracted fields before saving — never auto-save

Fields that can be extracted:
- Doctor name → diagnosed_by in medical_conditions
- Hospital/Clinic name → hospital_name in documents
- Date of visit → diagnosed_on in medical_conditions
- Condition/diagnosis name → matched to icd10_conditions or custom_name
- Medications prescribed → pre-fills medication name, dosage
- Notes/instructions → notes field

Fields NOT to auto-extract (user must set manually):
- Status (chronic/active/monitoring/resolved) — default to 'active'
- Family member — user must confirm which member this is for

Implementation notes:
- Use Claude API already integrated in the project
- Send image as base64 with media_type image/jpeg or image/png
- For PDFs convert first page to image before sending
- Always show extracted data in a review step before saving
- Mark extracted fields visually so user knows what was auto-filled
- This feeds Phase 2 — extracted structured data improves
  Second Opinion Engine matching accuracy

---

### 2. Height, Weight and BMI Tracking

When to build: As enhancement to Member Profile page
Location: src/app/(dashboard)/members/[id]/page.tsx

Database change needed (add migration in familycare repo):
- Add to family_members table:
  height_cm     numeric (e.g. 170.5)
  weight_kg     numeric (e.g. 68.0)
  bmi           numeric (calculated, stored for history)
  bmi_date      date (date of measurement)

BMI Calculation:
  BMI = weight_kg / (height_cm / 100)^2

Use Indian BMI Classification (WHO Asia-Pacific guidelines)
NOT Western cutoffs — Indian thresholds are lower:
  Underweight   < 18.5
  Normal        18.5 – 22.9
  Overweight    23.0 – 24.9
  Obese Class I   25.0 – 29.9
  Obese Class II  ≥ 30.0

UI:
- Add Height and Weight fields to member profile edit form
- Auto-calculate and display BMI with colour-coded classification badge:
  Underweight → blue
  Normal      → green
  Overweight  → yellow
  Obese I     → orange
  Obese II    → red
- Show date of last measurement
- Future Phase 2: track BMI over time as a trend chart

Why Indian cutoffs matter:
Indian populations have higher metabolic risk at lower BMI values
than Western populations. Using standard WHO cutoffs (24.9 = normal)
would incorrectly classify many at-risk Indian users as healthy.

---

### 3. Medical Condition Display Order — Pin to Top

When to build: As enhancement to Member Profile and Document Vault
Default sort: Descending by diagnosed_on date (most recent first)

Database change needed (add migration in familycare repo):
- Add to medical_conditions table:
  is_pinned   boolean not null default false

Pin behaviour:
- Pinned conditions always appear first, regardless of date
- Within pinned conditions: sort by diagnosed_on descending
- Within unpinned conditions: sort by diagnosed_on descending
- User can pin/unpin via a pin icon on each condition card
- Maximum pins: no limit — user decides what matters most

UI:
- Show pin icon (Lucide Pin icon) on each condition card
- Filled pin icon = pinned (indigo colour)
- Outline pin icon = unpinned (grey)
- Pinned conditions show a subtle "Pinned" indicator
- Pin/unpin is a single click — no confirmation needed
- Pinned conditions appear in both Member Profile and Document Vault

Sort order rule to implement everywhere conditions are listed:
  ORDER BY is_pinned DESC, diagnosed_on DESC

---

### 4. Document Vault — AI Extraction Entry Point

When building Document Vault upload form, add a placeholder for
the AI extraction feature even if not fully built yet:

- After file is selected in upload form, show a button:
  "✨ Extract details from document"
- In Phase 1 this can show "Coming soon" or be disabled
- The button should be in the correct position in the UI so
  it does not need to be moved when AI extraction is built

This avoids a UI restructure later when extraction is implemented.