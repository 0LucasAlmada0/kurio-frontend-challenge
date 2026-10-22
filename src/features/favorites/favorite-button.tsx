import { useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/icon'
import { errorMessage } from '@/api/http'
import { useFavorite } from './use-favorite'

export function FavoriteButton({ nftId, name, className = '', showLabel = false }: { nftId: string; name: string; className?: string; showLabel?: boolean }) {
  const favorite = useFavorite(nftId)
  const router = useRouter()
  const label = `${favorite.selected ? 'Desfavoritar' : 'Favoritar'} ${name}`
  return <>
    <Button className={`favorite-button ${className}`} variant={showLabel ? 'outline' : 'ghost'} aria-label={label} aria-pressed={favorite.selected} aria-busy={favorite.pending} disabled={favorite.disabled} title={favorite.session ? label : 'Entre para salvar favoritos'} onClick={() => {
      if (!favorite.session) { void router.navigate({ to: '/login', search: { redirect: router.state.location.href, reason: '' } }); return }
      if (favorite.queryFailed) favorite.retry(); else favorite.toggle()
    }}><Icon name="heart" />{showLabel && <span>{favorite.selected ? 'Favoritado' : 'Favoritar'}</span>}</Button>
    {favorite.error && <span role="alert" className="favorite-error">{errorMessage(favorite.error)}</span>}
  </>
}
