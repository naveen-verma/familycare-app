# FamilyCare — Project Context for Claude Code

## What This Project Is
FamilyCare is a patient-first family health management web application 
built for Indian families. It allows families to store medical history, 
prescriptions, reports, track medications, and eventually connect with 
specialists for second opinions.

## Business Model
- Free forever for patients
- Doctors/hospitals pay for visibility and patient engagement tools
- Phase 2 introduces a "Second Opinion Engine" where specialists pay 
  to be listed

## Tech Stack
- Framework: Next.js 14 (App Router) with TypeScript
- Styling: Tailwind CSS + shadcn/ui (Nova/Radix preset)
- Database: Supabase (PostgreSQL) with Row Level Security
- Auth: Supabase Auth — OTP based (email for dev, phone for prod)
- Icons: Lucide React
- Forms: React Hook Form + Zod
- Hosting: Vercel (planned)

## Project Structure
src/
├── app/
│   ├── (auth)/          ← login, verify, onboarding screens
│   └── (dashboard)/     ← main app screens after login
├── components/
│   ├── ui/              ← shadcn/ui components
│   ├── layout/          ← navigation, sidebar, header
│   ├── members/         ← family member components
│   ├── documents/       ← document vault components
│   ├── medications/     ← medication tracker components
│   └── conditions/      ← medical condition components
├── lib/
│   ├── supabase/        ← client.ts, server.ts, middleware.ts
│   ├── user.ts          ← user profile helpers
│   └── onboarding.ts    ← onboarding data functions
├── hooks/               ← custom React hooks
└── types/
    └── database.ts      ← TypeScript types for all DB tables

## Database (Supabase — separate repo: familycare)
11 tables all with RLS enabled:
- users — authenticated users (linked to Supabase Auth)
- family_groups — one per user, container for family
- family_members — each person in the family
- icd10_conditions — reference table, 84 curated conditions
- medical_conditions — diagnosed conditions per member
- documents — prescriptions, reports, scans
- medications — current and past medications
- medication_logs — reminder acknowledgement tracking
- medical_events — health timeline (visits, surgeries, tests)
- share_links — secure time-limited doctor share links
- interest_signals — Phase 2 seed, second opinion interest tracking

## Auth Flow
1. User enters email (dev) or mobile (prod) → OTP sent
2. User verifies OTP → Supabase Auth creates user
3. Database trigger (handle_new_user) auto-creates:
   - public.users record
   - public.family_groups record
4. App checks has_completed_onboarding() RPC
5. If false → /onboarding (2 step flow)
6. If true → /dashboard

## Current Development Status
### Completed
- Full dev/staging/prod environment setup
- 13 database migrations including auth trigger
- 84 ICD-10 conditions seeded
- Login page (email OTP for dev, phone OTP for prod)
- OTP verify page with 6-box input
- Onboarding page (2 steps — personal details + health info)
- Dashboard placeholder page

### In Progress
- Onboarding flow testing and fixes

### Up Next (in order)
1. Dashboard layout shell — navigation, sidebar
2. Screen 2 — Family dashboard (list of members)
3. Screen 3 — Member profile + add condition
4. Document vault — upload prescriptions and reports
5. Medication tracker
6. Medical timeline
7. Secure share link feature
8. Second opinion placeholder button

## Key Conventions
- Branch strategy: feature/ph1-xxx → dev → staging → main
- Commit format: feat:, fix:, chore:, schema:, workflow:
- All DB changes go in familycare repo (separate from this app)
- Environment: dev uses email OTP, prod uses phone OTP
- USE_PHONE_AUTH constant controls this in auth pages

## Environment Variables
NEXT_PUBLIC_SUPABASE_URL — local: http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY — from supabase status output
NEXT_PUBLIC_APP_NAME — FamilyCare
NEXT_PUBLIC_APP_ENV — development / staging / production

## Important Design Decisions
- RLS on every table — users only see their own family data
- Soft deletes everywhere — deleted_at column, never hard delete
- Phase 2 seeds baked into schema — second_opinion_requested, 
  specialist_matched, phase2_ready columns already exist
- ICD-10 structured tagging — conditions linked to standard codes
- n8n workflows planned for Week 9 — medication reminders, 
  follow-up nudges, share links, interest signals

## Database Helper Functions Available
- has_completed_onboarding(user_auth_id) → boolean
- get_current_user_profile() → json
- get_due_medication_reminders() → table
- get_due_followups() → table
- get_pending_interest_signals() → table
- deactivate_expired_share_links() → void