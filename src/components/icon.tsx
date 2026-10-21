import type { ComponentProps } from 'react'

const paths = {
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  cart: <><path d="M2 3h3l3 13h11l3-10H6M9 20h.01M18 20h.01" /></>,
  user: <><circle cx="12" cy="7" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3Z" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
  home: <path d="m3 10 9-8 9 8v11h-6v-7H9v7H3Z" />,
  scan: <><path d="M8 3H6a3 3 0 0 0-3 3v2m13-5h2a3 3 0 0 1 3 3v2M3 16v2a3 3 0 0 0 3 3h2m8 0h2a3 3 0 0 0 3-3v-2M1 12h22" /></>,
  login: <><path d="M14 4h5v16h-5M2 12h13m-4-4 4 4-4 4" /></>,
  arrow: <path d="M3 12h18m-7-7 7 7-7 7" />,
  back: <path d="m15 4-8 8 8 8" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  filters: <><path d="M10 6h11M3 6h2M3 18h11m5 0h2" /><rect x="5" y="3" width="5" height="6" rx="1" /><rect x="14" y="15" width="5" height="6" rx="1" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1" /><path d="m3 17 5-5 4 4 4-6 5 7" /></>,
  minus: <path d="M5 12h14" />,
  plus: <path d="M5 12h14M12 5v14" />,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 5 10 8 10-8" /></>,
} as const

export function Icon({ name, ...props }: ComponentProps<'svg'> & { name: keyof typeof paths }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>
}
