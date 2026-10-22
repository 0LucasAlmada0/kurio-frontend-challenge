import type { ComponentProps } from 'react'

const paths = {
  more: <><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></>,
  wallet: <><path d="M20 8V6a3 3 0 0 0-3-3H7a5 5 0 0 0-5 5v9a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V9a1 1 0 0 0-1-1H7M22 11h-5a3 3 0 0 0 0 6h5" /><path d="M17 14h.01M7 7h3" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
  warning: <><path d="m12 3 10 18H2Z" /><path d="M12 9v5m0 3v.01" /></>,
  eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="m3 3 18 18M10 5a12 12 0 0 1 12 7 15 15 0 0 1-3 4M6 6a16 16 0 0 0-4 6s3 7 10 7a12 12 0 0 0 5-1M10 10a3 3 0 0 0 4 4" /></>,
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
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
  plus: <path d="M5 12h14M12 5v14" />,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 5 10 8 10-8" /></>,
} as const

export function Icon({ name, ...props }: ComponentProps<'svg'> & { name: keyof typeof paths }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>
}
