import { Link } from '@tanstack/react-router'
import { Icon } from '@/components/icon'
import { useCart } from './queries'

export function CartLink({ className = '' }: { className?: string }) {
  const { cart } = useCart()
  const count = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  return <Link className={`icon-button cart-link ${className}`} to="/carrinho" aria-label="Carrinho de NFTs"><Icon name="cart" />{count > 0 && <span aria-hidden="true">{count}</span>}</Link>
}
