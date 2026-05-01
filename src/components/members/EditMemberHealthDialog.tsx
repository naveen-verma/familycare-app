'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { PencilIcon } from 'lucide-react'
import { updateMemberHealthAction } from '@/app/(dashboard)/members/[id]/actions'

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

export function EditMemberHealthDialog({
  memberId,
  initialHeight,
  initialWeight,
  triggerLabel,
}: {
  memberId: string
  initialHeight: number | null
  initialWeight: number | null
  triggerLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [height, setHeight] = useState(initialHeight?.toString() ?? '')
  const [weight, setWeight] = useState(initialWeight?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const heightNum = parseFloat(height)
  const weightNum = parseFloat(weight)
  const bmiValue =
    heightNum >= 50 && heightNum <= 250 && weightNum >= 2 && weightNum <= 300
      ? calcBMI(heightNum, weightNum)
      : null

  function validateInputs(): string | null {
    if (height && (heightNum < 50 || heightNum > 250)) return 'Height must be between 50 and 250 cm'
    if (weight && (weightNum < 2 || weightNum > 300)) return 'Weight must be between 2 and 300 kg'
    return null
  }

  async function handleSave() {
    const validationErr = validateInputs()
    if (validationErr) { setError(validationErr); return }

    setLoading(true)
    setError(null)
    try {
      const h = height ? heightNum : null
      const w = weight ? weightNum : null
      const bmi = h && w ? parseFloat(calcBMI(h, w).toFixed(1)) : null
      const bmiDate = bmi ? new Date().toISOString().split('T')[0] : null

      await updateMemberHealthAction(memberId, {
        height_cm: h,
        weight_kg: w,
        bmi,
        bmi_date: bmiDate,
      })
      setOpen(false)
      router.refresh()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (v) {
      setHeight(initialHeight?.toString() ?? '')
      setWeight(initialWeight?.toString() ?? '')
      setError(null)
    }
  }

  const trigger = triggerLabel ? (
    <button
      type="button"
      className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
    >
      {triggerLabel}
    </button>
  ) : (
    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
      <PencilIcon className="size-3 mr-1" />
      Edit
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Health Metrics</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-height">Height (cm)</Label>
              <Input
                id="edit-height"
                type="number"
                min={50}
                max={250}
                step={0.1}
                placeholder="e.g. 165"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-weight">Weight (kg)</Label>
              <Input
                id="edit-weight"
                type="number"
                min={2}
                max={300}
                step={0.1}
                placeholder="e.g. 68"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>

          {/* Live BMI */}
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

          <p className="text-xs text-muted-foreground">
            Leave both fields empty to clear health metrics. BMI date will be set to today.
          </p>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Metrics'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
