const names = new Set(['emerald-ape', 'violet-nomad', 'ivory-baron', 'golden-beat'])

export function nftImageSrcSet(src: string) {
  const match = /^\/assets\/nfts\/([^/]+)\.png$/.exec(src)
  return match && names.has(match[1]!) ? `${src.slice(0, -4)}.webp 1x` : undefined
}
