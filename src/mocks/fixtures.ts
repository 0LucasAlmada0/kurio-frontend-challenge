import type { Nft } from '@/api/contracts'

const originals = [
  { id: 'emerald-ape-042', name: 'Emerald Ape #042', image: 'emerald-ape.png', priceEth: '1.19', rarity: 'raro', available: 8 },
  { id: 'violet-nomad-314', name: 'Violet Nomad #314', image: 'violet-nomad.png', priceEth: '1.39', rarity: 'comum', available: 15 },
  { id: 'ivory-baron-088', name: 'Ivory Baron #088', image: 'ivory-baron.png', priceEth: '1.79', rarity: 'lendário', available: 2 },
  { id: 'golden-beat-207', name: 'Golden Beat #207', image: 'golden-beat.png', priceEth: '0.99', rarity: 'raro', available: 0 },
] as const

export function createNfts(): Nft[] {
  return Array.from({ length: 12 }, (_, index) => {
    const base = originals[index % originals.length]!
    const edition = Math.floor(index / originals.length)
    return {
      ...base,
      id: edition ? `${base.id}-edition-${edition}` : base.id,
      name: edition ? `${base.name} · Edição ${edition + 1}` : base.name,
      image: `/assets/nfts/${base.image}`,
      collection: edition === 2 ? 'Kurio Studio' : 'Kurio Apes',
      creator: edition === 1 ? 'Nova Sato' : 'Kurio Editions',
      version: 1,
      description: 'Um colecionável digital da coleção Kurio. Arte e identidade em um mundo digital sem fronteiras.',
    }
  })
}
