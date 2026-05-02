'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlusIcon, ChevronRight } from 'lucide-react'
import { addMemberAction } from '@/app/(dashboard)/members/actions'

// ---- BMI utilities (Indian WHO Asia-Pacific cutoffs) ----

function calcBMI(height: number, weight: number): number {
  return weight / Math.pow(height / 100, 2)
}

function bmiClass(bmi: number): { label: string; badgeClass: string } {
  if (bmi < 18.5) return { label: 'Underweight', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' }
  if (bmi < 23.0) return { label: 'Normal', badgeClass: 'bg-green-100 text-green-700 border-green-200' }
  if (bmi < 25.0) return { label: 'Overweight', badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
  if (bmi < 30.0) return { label: 'Obese Class I', badgeClass: 'bg-orange-100 text-orange-700 border-orange-200' }
  return { label: 'Obese Class II', badgeClass: 'bg-red-100 text-red-700 border-red-200' }
}

// ---- Form schema ----

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  blood_group: z.string().optional(),
  relation: z.string().min(1, 'Please select a relation'),
  mobile: z.string().optional(),
  height_cm: z
    .string()
    .optional()
    .refine((v) => !v || (Number(v) >= 50 && Number(v) <= 250), {
      message: 'Height must be between 50 and 250 cm',
    }),
  weight_kg: z
    .string()
    .optional()
    .refine((v) => !v || (Number(v) >= 2 && Number(v) <= 300), {
      message: 'Weight must be between 2 and 300 kg',
    }),
})

type FormData = z.infer<typeof schema>

interface AddMemberDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function AddMemberDialog({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onSuccess,
}: AddMemberDialogProps = {}) {
  const isControlled = externalOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? (externalOpen as boolean) : internalOpen
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [heightVal, setHeightVal] = useState('')
  const [weightVal, setWeightVal] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Live BMI calculation
  const heightNum = parseFloat(heightVal)
  const weightNum = parseFloat(weightVal)
  const bmiValue =
    heightNum >= 50 && heightNum <= 250 && weightNum >= 2 && weightNum <= 300
      ? calcBMI(heightNum, weightNum)
      : null

  function handleOpenChange(v: boolean) {
    if (!isControlled) setInternalOpen(v)
    externalOnOpenChange?.(v)
    if (!v) {
      reset()
      setHeightVal('')
      setWeightVal('')
      setError(null)
      setStep(1)
    }
  }

  async function handleNext() {
    const valid = await trigger(['full_name', 'relation'])
    if (valid) setStep(2)
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)
    try {
      const height = data.height_cm ? parseFloat(data.height_cm) : null
      const weight = data.weight_kg ? parseFloat(data.weight_kg) : null
      const bmi = height && weight ? parseFloat(calcBMI(height, weight).toFixed(1)) : null
      const bmiDate = bmi ? new Date().toISOString().split('T')[0] : null

      await addMemberAction({
        full_name: data.full_name,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        blood_group: data.blood_group,
        relation: data.relation,
        mobile: data.mobile,
        height_cm: height,
        weight_kg: weight,
        bmi,
        bmi_date: bmiDate,
      })
      handleOpenChange(false)
      router.refresh()
      onSuccess?.()
    } catch {
      setError('Failed to add member. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="sm">
            <PlusIcon />
            Add Member
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="space-y-1.5 mb-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Step {step} of 2</p>
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
            )}
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ── Step 1: Essential ── */}
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  {...register('full_name')}
                  placeholder="e.g. Rahul Sharma"
                />
                {errors.full_name && (
                  <p className="text-xs text-destructive">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
              </div>

              <div className="space-y-1.5">
                <Label>Relation *</Label>
                <Select onValueChange={(v) => setValue('relation', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select relation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.relation && (
                  <p className="text-xs text-destructive">{errors.relation.message}</p>
                )}
              </div>
            </>
          )}

          {/* ── Step 2: Health Profile ── */}
          {step === 2 && (
            <>
              <p className="text-xs text-muted-foreground -mt-1">
                All fields optional — you can update these later from the member profile.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select onValueChange={(v) => setValue('gender', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Blood Group</Label>
                  <Select onValueChange={(v) => setValue('blood_group', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                        <SelectItem key={bg} value={bg}>
                          {bg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  {...register('mobile')}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="height_cm">Height (cm)</Label>
                  <Input
                    id="height_cm"
                    type="number"
                    min={50}
                    max={250}
                    step={0.1}
                    placeholder="e.g. 165"
                    {...register('height_cm')}
                    onChange={(e) => {
                      register('height_cm').onChange(e)
                      setHeightVal(e.target.value)
                    }}
                  />
                  {errors.height_cm && (
                    <p className="text-xs text-destructive">{errors.height_cm.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weight_kg">Weight (kg)</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    min={2}
                    max={300}
                    step={0.1}
                    placeholder="e.g. 68"
                    {...register('weight_kg')}
                    onChange={(e) => {
                      register('weight_kg').onChange(e)
                      setWeightVal(e.target.value)
                    }}
                  />
                  {errors.weight_kg && (
                    <p className="text-xs text-destructive">{errors.weight_kg.message}</p>
                  )}
                </div>
              </div>

              {/* BMI (read-only) */}
              {bmiValue !== null && (
                <div className="rounded-lg border bg-muted/40 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground mb-1">BMI (calculated)</p>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{bmiValue.toFixed(1)}</span>
                    <span
                      className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium ${bmiClass(bmiValue).badgeClass}`}
                    >
                      {bmiClass(bmiValue).label}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {step === 1 ? (
              <Button type="button" onClick={handleNext} className="w-full">
                Next
                <ChevronRight className="size-4 ml-1" />
              </Button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={loading}
                  className="order-last sm:order-first text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
                >
                  Skip for now →
                </button>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? 'Adding...' : 'Add Member'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
