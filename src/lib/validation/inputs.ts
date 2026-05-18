// NAME FIELDS — null means valid, string means error message
export function validateName(
  value: string,
  fieldLabel: string = 'Name',
  required: boolean = true
): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return required ? `${fieldLabel} is required` : null
  }
  if (trimmed.length < 2) {
    return `${fieldLabel} must be at least 2 characters`
  }
  if (trimmed.length > 100) {
    return `${fieldLabel} must be under 100 characters`
  }
  if (/^\d+$/.test(trimmed)) {
    return `${fieldLabel} cannot be numbers only`
  }
  if (/^[^a-zA-Zऀ-ॿ]+$/.test(trimmed)) {
    return `${fieldLabel} must contain at least one letter`
  }
  return null
}

// INDIAN MOBILE NUMBER — first digit must be 6–9 (valid Indian prefix)
export function validateIndianMobile(
  value: string,
  required: boolean = false
): string | null {
  if (!value || value.trim() === '') {
    return required ? 'Mobile number is required' : null
  }
  const digits = value
    .replace(/[\s\-]/g, '')
    .replace(/^\+91/, '')
    .replace(/^91/, '')
    .replace(/^0/, '')
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return 'Enter a valid 10-digit mobile number'
  }
  return null
}

// EMAIL
export function validateEmail(
  value: string,
  required: boolean = true
): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return required ? 'Email address is required' : null
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return 'Enter a valid email address'
  }
  if (trimmed.length > 254) {
    return 'Email address is too long'
  }
  return null
}

// MEDICATION NAME
export function validateMedicationName(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Medication name is required'
  if (trimmed.length < 2) return 'Medication name must be at least 2 characters'
  if (trimmed.length > 100) return 'Medication name must be under 100 characters'
  return null
}

// DOSAGE — optional, but if provided must contain a digit or known unit
export function validateDosage(value: string): string | null {
  if (!value || value.trim() === '') return null
  const trimmed = value.trim()
  if (trimmed.length > 50) return 'Dosage must be under 50 characters'
  if (
    !/[\d]/.test(trimmed) &&
    !/mg|ml|mcg|tablet|capsule|drop|unit|iu|g\b/i.test(trimmed)
  ) {
    return 'Enter a valid dosage e.g. 500mg, 1 tablet, 2 drops'
  }
  return null
}

// GENERAL TEXT — optional free text with max length
export function validateText(
  value: string,
  fieldLabel: string,
  maxLength: number = 500,
  required: boolean = false
): string | null {
  if (!value || value.trim() === '') {
    return required ? `${fieldLabel} is required` : null
  }
  if (value.trim().length > maxLength) {
    return `${fieldLabel} must be under ${maxLength} characters`
  }
  return null
}

// DOCUMENT TITLE
export function validateDocumentTitle(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Document title is required'
  if (trimmed.length < 2) return 'Document title must be at least 2 characters'
  if (trimmed.length > 100) return 'Document title must be under 100 characters'
  return null
}

// MOBILE SANITISER — strips prefix, spaces, dashes; returns clean 10 digits
export function sanitiseMobile(value: string): string {
  return value
    .replace(/[\s\-]/g, '')
    .replace(/^\+91/, '')
    .replace(/^91/, '')
    .replace(/^0/, '')
    .slice(0, 10)
}
