import type { FocusEventHandler } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from '@/components/icon'
import { nftImageSrcSet } from '@/lib/nft-image'
import './home-sections.css'

const editorialPreviews = [
  { image: 'ivory-baron', title: 'Como funciona a propriedade de NFTs', description: 'Aprenda a colecionar, negociar e verificar ativos digitais.' },
  { image: 'emerald-ape', title: '10 artistas digitais para acompanhar', description: 'Conheça criadores que moldam a cultura digital.' },
  { image: 'violet-nomad', title: 'Raridade, atributos e procedência', description: 'Entenda raridade, procedência, direitos autorais e utilidade.' },
  { image: 'golden-beat', title: 'Como proteger sua carteira', description: 'Proteja sua carteira, seus ativos e sua identidade.' },
]

function HomeImage({ name }: { name: string }) {
  const src = `/assets/nfts/${name}.png`
  return <img src={src} srcSet={nftImageSrcSet(src)} width="400" height="400" loading="lazy" decoding="async" alt="" />
}

export function HomeSections() {
  return <div className="home-sections">
    <section className="home-promotions" aria-label="Explore a cultura digital">
      <div className="home-promotion">
        <HomeImage name="emerald-ape" />
        <div><h2>Lançamentos gênesis de edição limitada</h2><p>Colecione edições escassas diretamente dos criadores antes da revelação pública.</p><a href="#catalog" aria-label="Explorar o catálogo de NFTs">Explorar <Icon name="arrow" /></a></div>
      </div>
      <div className="home-promotion">
        <HomeImage name="ivory-baron" />
        <div><h2>Arte digital selecionada e muito mais</h2><p>Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.</p><a href="#catalog" aria-label="Explorar mais NFTs no catálogo">Explorar <Icon name="arrow" /></a></div>
      </div>
    </section>
    <section className="home-journal" aria-labelledby="home-journal-title">
      <h2 id="home-journal-title">Diário da Cunhagem</h2>
      <p className="home-section-intro">Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.</p>
      <p id="home-journal-unavailable" className="home-availability">Prévia editorial · Artigos indisponíveis nesta demonstração.</p>
      <ul className="home-journal-grid">{editorialPreviews.map(item => <li key={item.image}>
        <HomeImage name={item.image} />
        <div><span className="home-editorial-label">Diário da Cunhagem · Prévia</span><h3>{item.title}</h3><p>{item.description}</p><button type="button" disabled aria-describedby="home-journal-unavailable">Ler mais →</button></div>
      </li>)}</ul>
    </section>
    <section className="home-information" aria-label="Informações para colecionadores">
      <div className="home-information-item"><span className="home-information-icon" aria-hidden="true">W</span><h2>Segurança da carteira</h2><p>Proteja sua carteira e colecione arte digital verificada com confiança.</p></div>
      <div className="home-information-item"><span className="home-information-icon" aria-hidden="true">C</span><h2>Criadores em destaque</h2><p>Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.</p></div>
      <div className="home-information-item"><span className="home-information-icon" aria-hidden="true">D</span><h2>Alertas de lançamentos</h2><p>Calendários de cunhagem, novidades de listas de acesso e análises do mercado.</p></div>
      <div className="home-newsletter" role="group" aria-labelledby="home-newsletter-title" aria-describedby="home-newsletter-unavailable">
        <h2 id="home-newsletter-title">Antecipe-se ao próximo lançamento</h2>
        <div className="home-newsletter-controls"><label htmlFor="home-newsletter-email" className="sr-only">E-mail para novidades</label><Input id="home-newsletter-email" type="email" placeholder="digite seu e-mail..." disabled aria-describedby="home-newsletter-unavailable" /><Button type="button" disabled aria-describedby="home-newsletter-unavailable">Enviar</Button></div>
        <p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>
        <p id="home-newsletter-unavailable" className="home-availability">Inscrições indisponíveis nesta demonstração.</p>
      </div>
    </section>
  </div>
}

export function HomeFooter({ onFocusCapture }: { onFocusCapture: FocusEventHandler<HTMLElement> }) {
  return <footer id="about" className="home-footer page-width" onFocusCapture={onFocusCapture}>
    <div className="home-footer-band"><span className="brand">KURIO</span><p>Feito para colecionadores,<br />criadores e cultura.</p><p>Ambiente de demonstração<br />Sem pagamentos reais.</p></div>
    <div className="home-footer-groups">
      <nav aria-labelledby="home-footer-profile"><h2 id="home-footer-profile">Meu perfil</h2><Link to="/perfil" aria-label="Ver perfil do colecionador">Meu perfil</Link><Link to="/carteiras">Gerenciar carteiras</Link><Link to="/favoritos">Lista de interesse</Link><Link to="/carrinho" aria-label="Ver seu carrinho">Carrinho</Link></nav>
      <div><h2>Central de ajuda</h2><p className="home-availability">Conteúdo em breve</p><ul><li>Como comprar NFTs</li><li>Carteira e segurança</li><li>Política do mercado</li><li>Denunciar item</li></ul></div>
      <nav aria-labelledby="home-footer-market"><h2 id="home-footer-market">Coleções</h2><a href="#catalog">Explorar catálogo</a><p className="home-availability">Coleções e disponibilidade<br />nos filtros do catálogo.</p></nav>
      <div><h2>Redes sociais</h2><p className="home-availability">Canais indisponíveis na demonstração.</p><h2 className="home-wallet-title">Carteiras compatíveis</h2><p className="home-wallet-badge">MetaMask · WalletConnect · Coinbase</p><p className="home-availability">Conexão simulada.</p></div>
    </div>
    <p className="home-copyright">© 2026 Kurio. Propriedade digital para todos.</p>
  </footer>
}
