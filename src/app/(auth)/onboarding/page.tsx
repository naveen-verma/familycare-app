'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateUserProfile, createPrimaryFamilyMember } from '@/lib/onboarding'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { validateName, validateIndianMobile, sanitiseMobile } from '@/lib/validation/inputs'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
]

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male'   },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other'  },
]

function calculateAge(dobStr: string): number {
  const today = new Date()
  const birth = new Date(dobStr)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function calcBMI(h: number, w: number) { return w / Math.pow(h / 100, 2) }

function bmiClassification(value: number): { label: string; cls: string } {
  if (value < 18.5) return { label: 'Underweight', cls: 'bg-blue-100 text-blue-700' }
  if (value < 23.0) return { label: 'Normal', cls: 'bg-green-100 text-green-700' }
  if (value < 25.0) return { label: 'Overweight', cls: 'bg-yellow-100 text-yellow-700' }
  if (value < 30.0) return { label: 'Obese Class I', cls: 'bg-orange-100 text-orange-700' }
  return { label: 'Obese Class II', cls: 'bg-red-100 text-red-700' }
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)',
  marginBottom: 4, display: 'block',
}
const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  width: '100%', background: disabled ? '#9CA3AF' : '#0F6E56',
  borderRadius: 20, padding: '9px 18px', fontSize: 13, fontWeight: 500,
  color: 'white', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  transition: 'opacity 150ms',
})

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [nameError, setNameError] = useState('')
  const [mobileError, setMobileError] = useState('')

  // Step 2
  const [dob, setDob] = useState('')
  const [ageDeclarationAccepted, setAgeDeclarationAccepted] = useState(false)
  const [gender, setGender] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')

  const userAge = dob ? calculateAge(dob) : null
  const isUnderAge = userAge !== null && userAge < 18

  const bmi =
    heightCm && weightKg
      ? calcBMI(Number(heightCm), Number(weightKg))
      : null

  const formatMobile = (val: string) => val.replace(/\D/g, '').slice(0, 10)

  function handleDobChange(value: string) {
    setDob(value)
    setAgeDeclarationAccepted(false)
  }

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const nErr = validateName(fullName, 'Full name', true) ?? ''
    const mErr = validateIndianMobile(mobile, false) ?? ''
    setNameError(nErr)
    setMobileError(mErr)
    if (nErr || mErr) return
    if (!termsAccepted) {
      setError('Please accept the Terms of Service, Privacy Policy and Medical Disclaimer to continue')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const cleanMobile = mobile ? sanitiseMobile(mobile) : ''
      await updateUserProfile({ full_name: fullName.trim(), mobile: cleanMobile, city: city.trim(), state })
      if (user) {
        await supabase.from('users').update({ terms_accepted_at: new Date().toISOString() }).eq('supabase_auth_id', user.id)
      }
      setStep(2)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!dob) { setError('Please enter your date of birth'); return }
    setLoading(true)
    try {
      const heightVal = heightCm ? parseFloat(heightCm) : null
      const weightVal = weightKg ? parseFloat(weightKg) : null
      const bmiVal = bmi ? parseFloat(bmi.toFixed(1)) : null
      const bmiDate = heightVal && weightVal ? new Date().toISOString().split('T')[0] : null
      await createPrimaryFamilyMember({
        full_name: fullName.trim(),
        date_of_birth: dob,
        gender: gender || undefined,
        blood_group: bloodGroup || undefined,
        height_cm: heightVal,
        weight_kg: weightVal,
        bmi: bmiVal,
        bmi_date: bmiDate,
      })
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const step2Disabled = loading || !dob || isUnderAge || !ageDeclarationAccepted

  /* ── Step 1 ─────────────────────────────────────────────── */
  if (step === 1) {
    return (
      <AuthShell
        title="Tell us about yourself"
        subtitle="This helps us personalise your experience"
        step={1}
        totalSteps={2}
      >
        <form onSubmit={handleStep1} className="space-y-4">

          <div>
            <label style={labelStyle}>Full Name *</label>
            <Input
              placeholder="Naveen Kumar"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); if (nameError) setNameError('') }}
              onBlur={() => setNameError(validateName(fullName, 'Full name', true) ?? '')}
              autoFocus
            />
            {nameError && <p className="text-red-500 mt-1" style={{ fontSize: 11 }}>{nameError}</p>}
          </div>

          <div>
            <label style={labelStyle}>Mobile Number <span style={{ color: 'var(--color-text-tertiary)' }}>(optional)</span></label>
            <div className="flex items-center rounded-lg overflow-hidden"
              style={{ border: '0.5px solid var(--color-border-tertiary)' }}>
              <span className="shrink-0 px-3 text-sm"
                style={{ color: 'var(--color-text-secondary)', borderRight: '0.5px solid var(--color-border-tertiary)', paddingBlock: 9 }}>
                🇮🇳 +91
              </span>
              <input
                type="tel"
                placeholder="10-digit number"
                value={mobile}
                onChange={(e) => { setMobile(formatMobile(e.target.value)); if (mobileError) setMobileError('') }}
                onBlur={() => setMobileError(validateIndianMobile(mobile, false) ?? '')}
                maxLength={10}
                style={{ flex: 1, padding: '9px 12px', fontSize: 13, outline: 'none', background: 'transparent', border: 'none', color: 'var(--color-text-primary)' }}
              />
            </div>
            {mobileError && <p className="text-red-500 mt-1" style={{ fontSize: 11 }}>{mobileError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>City</label>
              <Input placeholder="Delhi" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3 rounded-lg px-3 py-3"
            style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              className="mt-0.5 shrink-0"
            />
            <label htmlFor="terms" className="leading-relaxed cursor-pointer" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              I agree to the{' '}
              <Link href="/terms" target="_blank" className="hover:underline font-medium" style={{ color: '#0F6E56' }}>Terms of Service</Link>
              ,{' '}
              <Link href="/privacy" target="_blank" className="hover:underline font-medium" style={{ color: '#0F6E56' }}>Privacy Policy</Link>
              {' '}and{' '}
              <Link href="/disclaimer" target="_blank" className="hover:underline font-medium" style={{ color: '#0F6E56' }}>Medical Disclaimer</Link>
              . I understand FamilyCare is not a substitute for professional medical advice.
            </label>
          </div>

          {error && (
            <div className="text-red-500 rounded-lg px-3 py-2" style={{ fontSize: 12, background: '#FEF2F2' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !termsAccepted} style={primaryBtn(loading || !termsAccepted)}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Continue →'}
          </button>
        </form>
      </AuthShell>
    )
  }

  /* ── Step 2 ─────────────────────────────────────────────── */
  return (
    <>
      {/* Back link above card */}
      <div className="flex justify-center" style={{ paddingTop: 32, background: 'var(--color-background-secondary)' }}>
        <button
          onClick={() => setStep(1)}
          style={{ fontSize: 12, color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
          className="hover:opacity-70 transition-opacity"
        >
          ← Back
        </button>
      </div>

      <AuthShell
        title="Health information"
        subtitle="Used to personalise health insights"
        step={2}
        totalSteps={2}
        showLogo={false}
      >
        <form onSubmit={handleStep2} className="space-y-4">

          <div>
            <label style={labelStyle}>Date of Birth *</label>
            <Input
              type="date"
              value={dob}
              onChange={(e) => handleDobChange(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            {dob && isUnderAge && (
              <p className="mt-1" style={{ fontSize: 11, color: '#EF4444', background: '#FEF2F2', padding: '6px 10px', borderRadius: 6 }}>
                FamilyCare is available for users aged 18 and above. Please ask a parent or guardian to create an account.
              </p>
            )}
          </div>

          {dob && !isUnderAge && userAge !== null && (
            <div className="flex items-start gap-3 rounded-lg px-3 py-3"
              style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
              <Checkbox
                id="ageDeclaration"
                checked={ageDeclarationAccepted}
                onCheckedChange={(checked) => setAgeDeclarationAccepted(checked === true)}
                className="mt-0.5 shrink-0"
              />
              <label htmlFor="ageDeclaration" className="cursor-pointer" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                I confirm that I am 18 years of age or older
              </label>
            </div>
          )}

          {/* Gender pill selector */}
          <div>
            <label style={labelStyle}>Gender</label>
            <div className="grid grid-cols-3 gap-2">
              {GENDER_OPTIONS.map(({ value, label }) => {
                const selected = gender === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGender(selected ? '' : value)}
                    className="py-1.5 text-center transition-colors"
                    style={{
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                      border: selected ? 'none' : '0.5px solid var(--color-border-tertiary)',
                      background: selected ? '#0F6E56' : 'transparent',
                      color: selected ? 'white' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Blood group */}
          <div>
            <label style={labelStyle}>Blood Group</label>
            <Select value={bloodGroup} onValueChange={setBloodGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Height + Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Height (cm) <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>(optional)</span></label>
              <Input
                type="number" placeholder="e.g. 165"
                value={heightCm} onChange={(e) => setHeightCm(e.target.value)}
                min={50} max={250}
              />
            </div>
            <div>
              <label style={labelStyle}>Weight (kg) <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>(optional)</span></label>
              <Input
                type="number" placeholder="e.g. 68"
                value={weightKg} onChange={(e) => setWeightKg(e.target.value)}
                min={2} max={300}
              />
            </div>
          </div>

          {/* BMI display */}
          {bmi !== null && (
            <div className="flex items-center justify-between rounded-lg px-3 py-2.5"
              style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
              <div>
                <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>BMI (auto-calculated)</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{bmi.toFixed(1)}</p>
              </div>
              <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${bmiClassification(bmi).cls}`}>
                {bmiClassification(bmi).label}
              </span>
            </div>
          )}

          {error && (
            <div className="text-red-500 rounded-lg px-3 py-2" style={{ fontSize: 12, background: '#FEF2F2' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={step2Disabled} style={primaryBtn(step2Disabled)}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Setting up…</> : 'Get started →'}
          </button>

          <p className="text-center" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            You can add more family members after setup
          </p>
        </form>
      </AuthShell>
    </>
  )
}
