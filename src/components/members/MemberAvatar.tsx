import Image from 'next/image'

const AVATAR_COLORS = ['#0D9488', '#7F77DD', '#D85A30', '#1D9E75', '#D4537E', '#378ADD']

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export interface MemberAvatarProps {
  name: string
  avatarUrl: string | null
  size: number
  colorIndex?: number
  className?: string
}

export function MemberAvatar({ name, avatarUrl, size, colorIndex = 0, className = '' }: MemberAvatarProps) {
  const color = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]
  const fontSize = size <= 32 ? 10 : size <= 48 ? 12 : size <= 64 ? 14 : 16

  if (avatarUrl) {
    return (
      <div
        className={`rounded-full overflow-hidden shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={avatarUrl}
          width={size}
          height={size}
          alt={name}
          className="rounded-full object-cover w-full h-full"
          unoptimized
        />
      </div>
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 text-white font-medium ${className}`}
      style={{ width: size, height: size, backgroundColor: color, fontSize }}
    >
      {getInitials(name)}
    </div>
  )
}
