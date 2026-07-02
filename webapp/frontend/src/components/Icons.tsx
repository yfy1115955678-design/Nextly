/** Airbnb-style SVG icons — thin stroke, ink-colored, 24x24 */

interface IconProps {
  size?: number
  className?: string
}

function icon(size?: number, className?: string) {
  return {
    width: size ?? 24,
    height: size ?? 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: '#222222',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  }
}

export function IconChart({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-6" />
    </svg>
  )
}

export function IconDocument({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
    </svg>
  )
}

export function IconSearch({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

export function IconStar({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export function IconPackage({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05" /><path d="M12 22.08V12" />
    </svg>
  )
}

export function IconUpload({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" /><path d="M12 3v12" />
    </svg>
  )
}

export function IconStore({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M3 9l1.41-5.65A2 2 0 0 1 6.36 2h11.28a2 2 0 0 1 1.95 1.35L21 9" />
      <path d="M3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9" /><path d="M9 22V12h6v10" />
    </svg>
  )
}

export function IconTag({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2" />
    </svg>
  )
}

export function IconMicroscope({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M6 22h12" /><path d="M12 22v-6" />
      <path d="M4 10a8 8 0 1 1 16 0" /><path d="M12 2v8" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function IconTarget({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  )
}

export function IconChat({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function IconUser({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function IconSave({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8" /><path d="M7 3v5h8" />
    </svg>
  )
}

export function IconRefresh({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

export function IconEye({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function IconEdit({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function IconFolder({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function IconCheckCircle({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
    </svg>
  )
}

export function IconAlert({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2" />
    </svg>
  )
}

export function IconSparkles({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.29 1.29L3 12l5.8 1.9a2 2 0 0 1 1.29 1.29L12 21l1.9-5.8a2 2 0 0 1 1.29-1.29L21 12l-5.8-1.9a2 2 0 0 1-1.29-1.29L12 3z" />
    </svg>
  )
}

export function IconClipboard({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}

export function IconArrowRight({ size, className }: IconProps) {
  const p = icon(size, className)
  return <svg {...p}><line x1="5" y1="12" x2="19" y2="12" /><path d="m12 5 7 7-7 7" /></svg>
}

export function IconPlay({ size, className }: IconProps) {
  const p = icon(size, className)
  return <svg {...p}><circle cx="12" cy="12" r="10" /><path d="M10 8l6 4-6 4V8z" fill="#222222" stroke="none" /></svg>
}

export function IconHistory({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}

export function IconRobot({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="2" x2="8" y2="4" /><line x1="16" y1="2" x2="16" y2="4" />
      <circle cx="9" cy="16" r="1" fill="#222222" /><circle cx="15" cy="16" r="1" fill="#222222" />
    </svg>
  )
}

export function IconShield({ size, className }: IconProps) {
  const p = icon(size, className)
  return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
}

export function IconLayers({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" />
    </svg>
  )
}

export function IconTrendingUp({ size, className }: IconProps) {
  const p = icon(size, className)
  return <svg {...p}><path d="M23 6l-9.5 9.5-5-5L1 18" /><path d="M17 6h6v6" /></svg>
}

export function IconSend({ size, className }: IconProps) {
  const p = icon(size, className)
  return <svg {...p}><line x1="22" y1="2" x2="11" y2="13" /><path d="m22 2-7 20-4-9-9-4 20-7z" /></svg>
}

export function IconPlus({ size, className }: IconProps) {
  const p = icon(size, className)
  return <svg {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}

export function IconDiff({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M8 3v18" /><path d="M16 3v18" />
      <path d="M3 8h5" /><path d="M3 15h5" /><path d="M16 8h5" /><path d="M16 15h5" />
      <line x1="10" y1="8" x2="14" y2="8" strokeWidth="2" fill="#222222" />
      <line x1="10" y1="15" x2="14" y2="15" />
    </svg>
  )
}

export function IconDownload({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

export function IconClip({ size, className }: IconProps) {
  const p = icon(size, className)
  return (
    <svg {...p}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}
