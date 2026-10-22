import { useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Icon } from '@/components/icon'
import { auth } from '@/features/auth/session'
import { errorMessage } from '@/api/http'

export function AccountLayout({ children }: { children: ReactNode }) {
  const [error, setError] = useState('')
  return <div className="account-layout"><aside className="account-sidebar"><h2>Meu perfil</h2><nav aria-label="Navegação da conta">
    <Link to="/perfil" activeProps={{ 'aria-current': 'page' }}><Icon name="user" />Dados do perfil</Link>
    <Link to="/carteiras" activeProps={{ 'aria-current': 'page' }}><Icon name="pin" />Carteiras</Link>
    <button disabled title="Atividade indisponível"><Icon name="cart" />Atividade</button>
    <Link to="/favoritos"><Icon name="heart" />Lista de interesse</Link>
    <button disabled title="Ofertas indisponíveis"><Icon name="image" />Ofertas</button>
    <button disabled title="Downloads indisponíveis"><Icon name="scan" />Arquivos baixados</button>
    <button disabled title="Suporte indisponível"><Icon name="warning" />Suporte</button>
  </nav><button className="account-logout" onClick={() => { void auth.logout().catch((cause: unknown) => setError(errorMessage(cause))) }}><Icon name="login" />Sair</button>{error && <p role="alert">{error}</p>}</aside><div className="account-content">{children}</div></div>
}
