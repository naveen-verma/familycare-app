export const metadata = {
  title: 'Terms of Service — FamilyCare',
}

const h2 = 'font-medium mt-6 mb-2'
const body = 'leading-7 mb-4'

export default function TermsPage() {
  return (
    <article style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
      <h1 className="font-medium mb-1" style={{ fontSize: 20, color: 'var(--color-text-primary)' }}>
        Terms of Service
      </h1>
      <p className="mb-6" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Last updated: April 2026</p>

      <p className={body} style={{ fontSize: 13 }}>
        Welcome to FamilyCare. By using our application, you agree to these Terms of Service.
        Please read them carefully before creating an account or using any feature of the platform.
      </p>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>1. Acceptance of Terms</h2>
        <p className={body} style={{ fontSize: 13 }}>
          By accessing or using FamilyCare (&quot;the App&quot;, &quot;our service&quot;), you agree to be bound by
          these Terms of Service and our Privacy Policy. If you do not agree to these terms, please
          do not use the application. These terms apply to all users of the platform, including
          individuals who are merely browsing or who create an account.
        </p>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>2. Description of Service</h2>
        <p className={body} style={{ fontSize: 13 }}>
          FamilyCare is a family health record management platform designed to help Indian families
          organise, store, and share medical information. The App provides tools to:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1" style={{ fontSize: 13 }}>
          <li>Maintain a digital medical vault for family members</li>
          <li>Track medications, diagnoses, and health events on a timeline</li>
          <li>Generate secure, time-limited summaries to share with healthcare providers</li>
          <li>Tag conditions using standardised ICD-10 codes</li>
        </ul>
        <p className={body} style={{ fontSize: 13, marginTop: 8 }}>
          FamilyCare is a health record management tool only. It is not a medical device, diagnostic
          tool, or healthcare provider. See our Medical Disclaimer for full details.
        </p>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>3. User Accounts</h2>
        <p className={body} style={{ fontSize: 13 }}>
          You must create an account to use FamilyCare. You are responsible for maintaining the
          confidentiality of your account credentials and for all activity that occurs under your
          account. You agree to:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1" style={{ fontSize: 13 }}>
          <li>Provide accurate and complete information during registration</li>
          <li>Keep your login details secure and not share them with others</li>
          <li>Notify us immediately of any unauthorised use of your account</li>
          <li>Take responsibility for all actions taken through your account</li>
        </ul>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>4. Health Information</h2>
        <p className={body} style={{ fontSize: 13 }}>
          You may store sensitive health information about yourself and your family members in
          FamilyCare. By doing so, you confirm that:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1" style={{ fontSize: 13 }}>
          <li>You have the right and consent of each family member to store their health information</li>
          <li>For minor children, you confirm you are their parent or legal guardian</li>
          <li>You understand this data is stored securely and is only accessible by you</li>
          <li>You will use the secure share feature responsibly and only share with healthcare providers</li>
        </ul>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>5. Acceptable Use</h2>
        <p className={body} style={{ fontSize: 13 }}>You agree not to:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1" style={{ fontSize: 13 }}>
          <li>Use the App for any unlawful purpose or in violation of any applicable laws</li>
          <li>Upload content that infringes any third-party intellectual property rights</li>
          <li>Attempt to gain unauthorised access to other users&apos; data</li>
          <li>Use the App to distribute spam, malware, or harmful content</li>
          <li>Reverse-engineer, decompile, or attempt to extract the source code of the App</li>
          <li>Misrepresent health information or use the App in a way that could harm others</li>
        </ul>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>6. Intellectual Property</h2>
        <p className={body} style={{ fontSize: 13 }}>
          The FamilyCare application, including its design, code, features, and content, is owned by
          FamilyCare and protected by applicable intellectual property laws. You retain ownership of
          the health data you upload. By using the App you grant FamilyCare a limited licence to
          store, process, and display your data solely to provide the service to you.
        </p>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>7. Limitation of Liability</h2>
        <p className={body} style={{ fontSize: 13 }}>
          To the fullest extent permitted by law, FamilyCare shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages arising from your use of the App.
          FamilyCare is not liable for any medical decisions made based on information stored or
          displayed in the App. Always consult a qualified healthcare professional for medical advice.
        </p>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>8. Termination</h2>
        <p className={body} style={{ fontSize: 13 }}>
          You may delete your account at any time. We reserve the right to suspend or terminate your
          account if you violate these terms. Upon termination, your data will be handled in
          accordance with our Privacy Policy and applicable data protection laws.
        </p>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>9. Changes to Terms</h2>
        <p className={body} style={{ fontSize: 13 }}>
          We may update these Terms of Service from time to time. We will notify you of significant
          changes via the App or by email. Continued use of the App after changes are posted
          constitutes your acceptance of the updated terms.
        </p>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>10. Governing Law</h2>
        <p className={body} style={{ fontSize: 13 }}>
          These Terms shall be governed by and construed in accordance with the laws of India.
          Any disputes arising under these Terms shall be subject to the exclusive jurisdiction
          of the courts of India.
        </p>
      </section>

      <section>
        <h2 className={h2} style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>11. Contact</h2>
        <p className={body} style={{ fontSize: 13 }}>
          For questions about these Terms of Service, please contact us through the FamilyCare
          application or via the feedback option in your account settings.
        </p>
      </section>
    </article>
  )
}
