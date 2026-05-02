export const metadata = {
  title: 'Medical Disclaimer — FamilyCare',
}

export default function DisclaimerPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Disclaimer</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: April 2026</p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4 mb-8">
        <p className="text-amber-800 font-semibold text-sm mb-1">Important Notice</p>
        <p className="text-amber-700 text-sm leading-relaxed">
          FamilyCare is a health record management tool, not a medical service. Nothing in this
          application constitutes medical advice, diagnosis, or treatment. Always consult a
          qualified healthcare professional for any health concerns.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Not a Medical Service</h2>
        <p className="text-gray-700 leading-relaxed">
          FamilyCare is a digital platform designed to help families organise and manage their
          health records. It is not a hospital, clinic, medical device, diagnostic service,
          or healthcare provider. The application does not employ doctors, nurses, or any
          licensed medical professionals.
        </p>
        <p className="text-gray-700 leading-relaxed mt-3">
          No content, feature, or output of FamilyCare — including condition tags, medication
          tracking, health timelines, or any AI-generated summaries — should be interpreted as
          medical advice, a medical diagnosis, a treatment recommendation, or a substitute for
          professional medical consultation.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Always Consult a Doctor</h2>
        <p className="text-gray-700 leading-relaxed">
          If you have a medical concern, symptom, or question about your health or the health
          of a family member, always seek advice from a qualified and licensed healthcare
          professional. Do not delay seeking medical attention or disregard professional medical
          advice because of anything you have read or stored in FamilyCare.
        </p>
        <p className="text-gray-700 leading-relaxed mt-3">
          In a medical emergency, call emergency services immediately (dial 112 in India).
          Do not attempt to use FamilyCare as a substitute for emergency medical care.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Health Records Are User-Provided</h2>
        <p className="text-gray-700 leading-relaxed">
          All health information stored in FamilyCare is entered by you, the user, based on
          documents and records from your healthcare providers. FamilyCare does not verify,
          validate, or authenticate any health information entered into the platform.
          Accuracy of stored information is entirely your responsibility.
        </p>
        <p className="text-gray-700 leading-relaxed mt-3">
          FamilyCare is not responsible for errors, inaccuracies, or omissions in the health
          information you store. Always refer to original documents provided by your healthcare
          team for authoritative medical information.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">4. ICD-10 Condition Tags</h2>
        <p className="text-gray-700 leading-relaxed">
          FamilyCare uses ICD-10 (International Classification of Diseases, 10th Revision)
          codes to help you tag and organise medical conditions. These codes are an
          internationally recognised classification system used by healthcare professionals.
          Their presence in the app is for organisational and record-keeping purposes only.
        </p>
        <p className="text-gray-700 leading-relaxed mt-3">
          Selecting an ICD-10 condition code in FamilyCare does not constitute a diagnosis.
          Medical diagnoses must be made by licensed medical professionals following proper
          clinical evaluation.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Medication Information</h2>
        <p className="text-gray-700 leading-relaxed">
          The medication tracker in FamilyCare is designed solely to help you record and
          remember medications that have been prescribed to you by a qualified doctor or
          pharmacist. FamilyCare does not provide medication recommendations, dosage guidance,
          drug interaction warnings, or any other pharmacological advice.
        </p>
        <p className="text-gray-700 leading-relaxed mt-3">
          Never start, stop, or alter any medication based on anything in FamilyCare.
          Always follow the instructions of your prescribing doctor or pharmacist.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">6. AI-Generated Content (Phase 2)</h2>
        <p className="text-gray-700 leading-relaxed">
          In Phase 2, FamilyCare will introduce AI-assisted features including document
          extraction, plain-language summaries, and suggested questions to ask your doctor.
          These features are designed as aids to help you prepare for doctor consultations,
          not to replace them.
        </p>
        <p className="text-gray-700 leading-relaxed mt-3">
          Any AI-generated content is produced by automated systems and has not been reviewed
          by a medical professional. It may contain errors, omissions, or inaccuracies.
          Always verify AI-generated content with a qualified healthcare provider before
          acting on it.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Second Opinion Feature (Phase 2)</h2>
        <p className="text-gray-700 leading-relaxed">
          The Second Opinion Engine, when available, connects patients with verified independent
          specialists who provide asynchronous written opinions on medical records. A second
          opinion from a specialist via FamilyCare:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-1 text-gray-700">
          <li>Is based only on the documents and information you submit — not a physical examination</li>
          <li>Does not replace your primary treating doctor&apos;s ongoing care and advice</li>
          <li>Should be shared with and reviewed by your treating doctor before any clinical decisions are made</li>
          <li>Is the opinion of one specialist and may differ from other medical opinions</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Shared Medical Summaries</h2>
        <p className="text-gray-700 leading-relaxed">
          The secure share links generated by FamilyCare produce summaries of your stored health
          records. These summaries are designed to help you quickly share your medical history
          with a consulting doctor. They are not medical reports and should not be treated as
          such. The receiving doctor is responsible for clinical decisions based on a full
          evaluation of the patient.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">9. No Liability for Medical Outcomes</h2>
        <p className="text-gray-700 leading-relaxed">
          FamilyCare and its operators shall not be held liable for any health outcomes, medical
          decisions, treatment choices, or adverse events arising from the use of the App or
          reliance on any information stored or generated within it. By using FamilyCare, you
          acknowledge and accept this limitation of liability in full.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Questions</h2>
        <p className="text-gray-700 leading-relaxed">
          If you have questions about this Medical Disclaimer or about what FamilyCare does and
          does not do, please contact us through the feedback option in the App.
          For any health concerns, please consult a qualified healthcare professional.
        </p>
      </section>
    </article>
  )
}
