export const metadata = {
  title: 'Privacy Policy — FamilyCare',
}

const h2 = 'font-medium mt-6 mb-2'
const body = 'leading-7 mb-4'

export default function PrivacyPage() {
  return (
    <article style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
      <h1 className="font-medium mb-1" style={{ fontSize: 20, color: 'var(--color-text-primary)' }}>
        Privacy Policy
      </h1>
      <p className="mb-6" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Last updated: April 2026</p>

      <p className="leading-relaxed mb-4" style={{ fontSize: 13 }}>
        FamilyCare is built on the belief that your family&apos;s health data belongs to you alone.
        This Privacy Policy explains what data we collect, how we use it, and what rights you have
        over it. We are committed to protecting your privacy and the sensitive health information
        you entrust to us.
      </p>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>1. Data We Collect</h2>
        <p className="leading-relaxed mb-3" style={{ fontSize: 13 }}>
          We collect only the information necessary to provide the FamilyCare service:
        </p>
        <p className="font-medium mb-1" style={{ fontSize: 13, color: "var(--color-text-primary)" }}>Account Information</p>
        <ul className="list-disc pl-6 mb-3 space-y-1" style={{ fontSize: 13 }}>
          <li>Mobile number or email address (used for authentication via OTP)</li>
          <li>Full name, city, and state (provided during onboarding)</li>
          <li>Date of birth, gender, and blood group (provided during onboarding)</li>
        </ul>
        <p className="font-medium mb-1" style={{ fontSize: 13, color: "var(--color-text-primary)" }}>Health Information (user-provided)</p>
        <ul className="list-disc pl-6 mb-3 space-y-1" style={{ fontSize: 13 }}>
          <li>Medical conditions and diagnoses with ICD-10 codes</li>
          <li>Medications — names, dosages, and frequencies</li>
          <li>Medical documents — prescriptions, test reports, scans (PDFs and images)</li>
          <li>Health timeline events — doctor visits, surgeries, tests, vaccinations</li>
          <li>Height, weight, and BMI measurements</li>
          <li>Family member profiles within your family group</li>
        </ul>
        <p className="font-medium mb-1" style={{ fontSize: 13, color: "var(--color-text-primary)" }}>Usage Information</p>
        <ul className="list-disc pl-6 space-y-1" style={{ fontSize: 13 }}>
          <li>Secure share link usage — when links are created and viewed</li>
          <li>Interest signals — when you tap &quot;Find Second Opinion&quot; (to improve Phase 2 features)</li>
        </ul>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>2. How We Use Your Data</h2>
        <p className="leading-relaxed mb-3" style={{ fontSize: 13 }}>We use your information to:</p>
        <ul className="list-disc pl-6 space-y-1" style={{ fontSize: 13 }}>
          <li>Authenticate you and provide access to your family&apos;s health records</li>
          <li>Display your health data to you in a structured, useful format</li>
          <li>Generate secure share links so you can share summaries with doctors</li>
          <li>Send medication reminders and follow-up alerts (with your consent)</li>
          <li>Improve the product — aggregate, anonymised usage patterns only</li>
          <li>Understand demand for the Second Opinion Engine (Phase 2)</li>
        </ul>
        <p className="leading-relaxed mt-2 mb-4" style={{ fontSize: 13 }}>
          We do not sell your personal data or health information to any third party.
          We do not use your data for advertising purposes.
        </p>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>3. Data Storage and Security</h2>
        <p className={body} style={{ fontSize: 13 }}>
          Your data is stored on Supabase, a secure cloud database platform with industry-standard
          encryption at rest and in transit. We implement Row Level Security (RLS) on all database
          tables — this means your data is accessible only to you; no other user or account can
          query your records. Documents are stored in secure cloud storage with access controls
          tied to your authenticated session.
        </p>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>4. Data Sharing</h2>
        <p className="leading-relaxed mb-3" style={{ fontSize: 13 }}>
          Your health data is never shared with any third party without your explicit action. The
          only sharing that occurs is:
        </p>
        <ul className="list-disc pl-6 space-y-1" style={{ fontSize: 13 }}>
          <li>
            <strong>Secure share links:</strong> When you explicitly generate a share link and
            send it to a doctor. These links are time-limited and contain only the information
            you choose to include.
          </li>
          <li>
            <strong>Service providers:</strong> We use Supabase for database and storage, and
            Vercel for hosting. These providers process data only to deliver the service and are
            contractually bound to protect your data.
          </li>
          <li>
            <strong>Legal requirements:</strong> We may disclose data if required to do so by
            law or in response to valid legal processes.
          </li>
        </ul>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>5. Family Member Data</h2>
        <p className={body} style={{ fontSize: 13 }}>
          When you add family members and store their health information, you confirm that you have
          obtained appropriate consent from adult family members to store and manage their data.
          For minor children, you confirm you are their parent or legal guardian. All family data
          is protected under the same security measures as your own data.
        </p>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>6. Your Rights</h2>
        <p className="leading-relaxed mb-3" style={{ fontSize: 13 }}>You have the right to:</p>
        <ul className="list-disc pl-6 space-y-1" style={{ fontSize: 13 }}>
          <li><strong>Access:</strong> View all data we hold about you through the App</li>
          <li><strong>Correction:</strong> Update or correct inaccurate information at any time</li>
          <li><strong>Deletion:</strong> Request deletion of your account and all associated data</li>
          <li><strong>Portability:</strong> Request an export of your health data</li>
          <li><strong>Withdrawal of consent:</strong> Opt out of non-essential data processing at any time</li>
        </ul>
        <p className="leading-relaxed mt-2 mb-4" style={{ fontSize: 13 }}>
          To exercise any of these rights, use the account settings in the App or contact us
          directly.
        </p>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>7. Data Retention</h2>
        <p className={body} style={{ fontSize: 13 }}>
          We retain your data for as long as your account is active. If you delete your account,
          we will delete or anonymise your personal data within 30 days, except where retention
          is required by applicable law. Health records use soft deletes — records marked as
          deleted are not shown in the app but are retained briefly before permanent removal.
        </p>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>8. Children&apos;s Privacy</h2>
        <p className={body} style={{ fontSize: 13 }}>
          FamilyCare accounts are created by adults (18 years or older) on behalf of their family.
          We do not knowingly collect personal data from children who are not under the supervision
          of a parent or guardian using the App. Health data about minor children is managed by
          their parent or guardian account holder.
        </p>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>9. Future Features — Anonymised Data</h2>
        <p className={body} style={{ fontSize: 13 }}>
          In Phase 3 of FamilyCare, we plan to offer healthcare organisations access to
          anonymised, aggregated condition data (e.g., prevalence of specific conditions in a
          region). This will only proceed with explicit opt-in consent from users. No individual
          health data will ever be shared or sold. We will update this Privacy Policy and seek
          fresh consent before any such programme is launched.
        </p>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>10. Updates to This Policy</h2>
        <p className={body} style={{ fontSize: 13 }}>
          We may update this Privacy Policy as the product evolves. We will notify you of material
          changes through the App. Continued use of FamilyCare after an update constitutes your
          acceptance of the revised policy.
        </p>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>11. Contact</h2>
        <p className={body} style={{ fontSize: 13 }}>
          For any privacy-related concerns or to exercise your data rights, please contact us
          through the feedback option in the FamilyCare app.
        </p>
      </section>
    </article>
  )
}
