import type { ReactNode, SVGProps } from 'react'

export type SymbolName =
  | 'overview'
  | 'target'
  | 'search'
  | 'cube'
  | 'shield'
  | 'check'
  | 'sparkle'
  | 'upload'
  | 'arrow'
  | 'history'
  | 'reset'
  | 'close'
  | 'file'
  | 'alert'
  | 'chevron'

const paths: Record<SymbolName, ReactNode> = {
  overview: <><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
  cube: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  shield: <><path d="M12 3 20 6v5c0 5-3.2 8.2-8 10-4.8-1.8-8-5-8-10V6z" /></>,
  check: <><path d="m5 12 4.2 4L19 6.5" /></>,
  sparkle: <><path d="M12 2.8c.7 4.5 2.7 6.5 7.2 7.2-4.5.7-6.5 2.7-7.2 7.2-.7-4.5-2.7-6.5-7.2-7.2 4.5-.7 6.5-2.7 7.2-7.2Z" /><path d="M19 16c.3 1.7 1.1 2.5 2.8 2.8-1.7.3-2.5 1.1-2.8 2.8-.3-1.7-1.1-2.5-2.8-2.8 1.7-.3 2.5-1.1 2.8-2.8Z" /></>,
  upload: <><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M4 15v5h16v-5" /></>,
  arrow: <><path d="M5 12h14m-5-5 5 5-5 5" /></>,
  history: <><path d="M4 5v5h5" /><path d="M5.8 17.5A8 8 0 1 0 4 10" /><path d="M12 7v5l3 2" /></>,
  reset: <><path d="M4 4v6h6" /><path d="M5.2 17.4A8 8 0 1 0 4 10" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  alert: <><path d="M12 3 22 20H2z" /><path d="M12 9v4m0 3h.01" /></>,
  chevron: <><path d="m8 10 4 4 4-4" /></>,
}

export default function Symbol({ name, ...props }: { name: SymbolName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
