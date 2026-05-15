'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { CameraIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MemberAvatar } from '@/components/members/MemberAvatar'
import { getCroppedImg } from '@/lib/cropImage'
import { createClient } from '@/lib/supabase/client'

export interface AvatarUploaderProps {
  memberId: string
  familyGroupId: string
  currentAvatarUrl: string | null
  memberName: string
  size?: number
  colorIndex?: number
  onSuccess?: (newUrl: string) => void
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export function AvatarUploader({
  memberId,
  familyGroupId,
  currentAvatarUrl,
  memberName,
  size = 80,
  colorIndex = 0,
  onSuccess,
}: AvatarUploaderProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayUrl, setDisplayUrl] = useState<string | null>(currentAvatarUrl)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isCropOpen, setIsCropOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_SIZE_BYTES) {
      setError('Photo must be under 5MB.')
      e.target.value = ''
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setIsCropOpen(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  async function handleSave() {
    if (!imageSrc || !croppedAreaPixels) return
    setUploading(true)
    setError(null)
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
      const supabase = createClient()
      const path = `${familyGroupId}/${memberId}/avatar.jpg`

      const { error: uploadError } = await supabase.storage
        .from('member-avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      const { data: signedData, error: signError } = await supabase.storage
        .from('member-avatars')
        .createSignedUrl(path, 60 * 60 * 24 * 365)

      if (signError || !signedData?.signedUrl) throw signError ?? new Error('Signed URL failed')

      const signedUrl = signedData.signedUrl

      const { error: dbError } = await supabase
        .from('family_members')
        .update({ avatar_url: signedUrl })
        .eq('id', memberId)

      if (dbError) throw dbError

      setDisplayUrl(signedUrl)
      setIsCropOpen(false)
      setImageSrc(null)
      onSuccess?.(signedUrl)
      router.refresh()
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleCancel() {
    setIsCropOpen(false)
    setImageSrc(null)
    setError(null)
  }

  const cameraSize = Math.round(size * 0.32)
  const cameraOffset = Math.round(size * 0.04)

  return (
    <>
      {/* Avatar with camera overlay */}
      <div className="relative inline-block cursor-pointer" onClick={handleAvatarClick}>
        <MemberAvatar
          name={memberName}
          avatarUrl={displayUrl}
          size={size}
          colorIndex={colorIndex}
        />
        <div
          className="absolute bg-teal-600 rounded-full flex items-center justify-center shadow-sm"
          style={{
            width: cameraSize,
            height: cameraSize,
            bottom: cameraOffset,
            right: cameraOffset,
          }}
        >
          <CameraIcon style={{ width: cameraSize * 0.55, height: cameraSize * 0.55, color: 'white' }} />
        </div>
      </div>

      {error && !isCropOpen && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Crop modal */}
      {isCropOpen && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={handleCancel} />

          {/* Modal */}
          <div className="relative z-10 bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-xl flex flex-col max-h-[90dvh]">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <p className="text-sm font-semibold">Adjust photo</p>
              <button
                onClick={handleCancel}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="size-4 text-gray-500" />
              </button>
            </div>

            {/* Crop area */}
            <div className="relative w-full" style={{ height: 300 }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom slider */}
            <div className="px-4 pt-3 pb-2 shrink-0">
              <label className="text-xs text-muted-foreground block mb-1.5">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-destructive px-4 pb-1 shrink-0">{error}</p>
            )}

            {/* Footer */}
            <div className="flex gap-2 px-4 pb-4 pt-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleCancel}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={handleSave}
                disabled={uploading}
              >
                {uploading ? 'Saving...' : 'Save photo'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
