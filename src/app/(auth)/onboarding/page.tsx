'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserProfile, createPrimaryFamilyMember } from '@/lib/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry'
]

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1 data
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  // Step 2 data
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')

  const formatMobile = (val: string) =>
    val.replace(/\D/g, '').slice(0, 10)

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('Please enter your full name')
      return
    }
    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    setLoading(true)
    try {
      await updateUserProfile({
        full_name: fullName.trim(),
        mobile,
        city: city.trim(),
        state
      })
      setStep(2)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!dob) {
      setError('Please enter your date of birth')
      return
    }

    setLoading(true)
    try {
      await createPrimaryFamilyMember({
        full_name: fullName.trim(),
        date_of_birth: dob,
        gender: gender || undefined,
        blood_group: bloodGroup || undefined
      })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-lg border-0">
      {/* Progress Indicator */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-2 mb-2">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
        </div>
        <p className="text-xs text-gray-500 text-right">Step {step} of 2</p>
      </div>

      {/* Step 1 — Personal Details */}
      {step === 1 && (
        <>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold">
              Tell us about yourself
            </CardTitle>
            <CardDescription>
              This helps us personalise your FamilyCare experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Naveen Kumar"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-600 font-medium">
                    🇮🇳 +91
                  </div>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="98765 43210"
                    value={mobile}
                    onChange={e => setMobile(formatMobile(e.target.value))}
                    maxLength={10}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Delhi"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Continue →'}
              </Button>
            </form>
          </CardContent>
        </>
      )}

      {/* Step 2 — Health Details */}
      {step === 2 && (
        <>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold">
              Your health details
            </CardTitle>
            <CardDescription>
              Basic health information for {fullName || 'you'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStep2} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select value={bloodGroup} onValueChange={setBloodGroup}>
                  <SelectTrigger id="bloodGroup">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map(bg => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  ← Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? 'Setting up...' : 'Get Started 🎉'}
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500">
                You can add more family members after setup
              </p>
            </form>
          </CardContent>
        </>
      )}
    </Card>
  )
}