import { FileText, FileImage, FileScan, Shield, Syringe, File } from 'lucide-react'
import type { DocumentType } from '@/types/database'

const icons: Record<DocumentType, React.ElementType> = {
  prescription: FileText,
  report: FileText,
  scan: FileScan,
  insurance: Shield,
  vaccination: Syringe,
  other: File,
}

const colors: Record<DocumentType, string> = {
  prescription: 'text-blue-600 bg-blue-50',
  report: 'text-purple-600 bg-purple-50',
  scan: 'text-orange-600 bg-orange-50',
  insurance: 'text-green-600 bg-green-50',
  vaccination: 'text-teal-600 bg-teal-50',
  other: 'text-gray-600 bg-gray-50',
}

export function DocumentTypeIcon({
  type,
  fileType,
  size = 'md',
}: {
  type: DocumentType
  fileType?: string | null
  size?: 'sm' | 'md'
}) {
  const isImage = fileType?.startsWith('image/')
  const Icon = isImage ? FileImage : icons[type] ?? File
  const colorClass = colors[type] ?? colors.other
  const sizeClass = size === 'sm' ? 'size-8' : 'size-10'
  const iconSize = size === 'sm' ? 'size-4' : 'size-5'

  return (
    <div className={`${sizeClass} rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
      <Icon className={iconSize} />
    </div>
  )
}
