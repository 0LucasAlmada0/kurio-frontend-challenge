import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, useRouterState } from '@tanstack/react-router'
import { catalogOptions } from './queries'
import { NFTCard } from '@/components/nft-card'
import { CatalogLoading } from '@/components/loading'
import { ErrorState } from '@/components/error-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from '@/components/icon'
import { CatalogFilters } from '@/components/filter-group'

const route = getRouteApi('/')

function SearchForm({ query, submit }: { query: string; submit: (q: string) => void }) {
  const [value, setValue] = useState(query)
  function onSubmit(event: FormEvent) { event.preventDefault(); submit(value.trim()) }
  return <form onSubmit={onSubmit} className="search-form" role="search"><label htmlFor="search" className="sr-only">Buscar NFTs</label><Icon name="search" /><Input id="search" type="search" placeholder="Explorar coleções" value={value} onChange={(event) => setValue(event.target.value)} /><Button type="submit" variant="outline">Buscar</Button></form>
}

export function CatalogPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const result = useQuery(catalogOptions(search))
  const data = result.data
  const showSearch = useRouterState({ select: (state) => state.location.hash === 'search' })

  return <>
    <div className={`catalog-search${showSearch ? ' search-open' : ''}`}><SearchForm key={search.q} query={search.q} submit={(q) => { void navigate({ search: { ...search, q, page: 1 } }) }} /><button className="filter-toggle" disabled aria-label="Filtros · em breve" title="Filtros · em breve"><Icon name="filters" /></button></div>
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-copy"><p>Bem-vindo à Kurio</p><h1 id="hero-heading"><span className="desktop-hero-title">SEJA DONO DO FUTURO<br />DA ARTE DIGITAL</span><span className="mobile-hero-title">SEJA DONO DA<br />CULTURA DIGITAL</span></h1><p className="hero-description">Descubra NFTs selecionados de criadores do mundo todo.</p><a href="#catalog" className="hero-cta">EXPLORAR <Icon name="arrow" /></a></div>
      <div className="hero-art" aria-hidden="true"><img src="/assets/nfts/emerald-ape.png" width="400" height="400" alt="" /><img src="/assets/nfts/violet-nomad.png" width="160" height="160" alt="" /></div>
      <div className="hero-dots" aria-hidden="true"><span /><span /><span /></div>
    </section>
    <section id="catalog" aria-labelledby="catalog-heading" className="catalog-layout">
      <CatalogFilters />
      <div className="catalog-content">
        <div className="catalog-heading"><div className="catalog-tabs"><h2 id="catalog-heading">Todos os NFTs</h2><button disabled title="Novos lançamentos · em breve">Novos lançamentos</button><button disabled title="Em alta · em breve">Em alta</button></div><div className="sort-control"><label htmlFor="sort">Ordenar por:</label><select id="sort" value={search.sort} onChange={(event) => { void navigate({ search: { ...search, page: 1, sort: event.target.value as typeof search.sort } }) }}><option value="name">Nome</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select><Icon name="chevron" /></div></div>
        <p className="catalog-count">{data ? `${data.total} colecionáveis` : 'Explorando a coleção'}</p>
        {result.isPending ? <CatalogLoading /> : result.isError ? <ErrorState error={result.error} retry={() => { void result.refetch() }} /> : !data?.items.length ? <div className="state-panel" role="status"><h3>Nenhum NFT encontrado</h3><p>Tente buscar outro personagem ou coleção.</p></div> : <>
          <p className="refresh-status" role="status">{result.isFetching ? 'Atualizando coleção…' : ''}</p>
          <div className="nft-grid">{data.items.map((nft, index) => <NFTCard key={nft.id} nft={nft} index={index} />)}</div>
          <nav className="pagination" aria-label="Páginas do catálogo"><Button variant="outline" disabled={search.page <= 1} onClick={() => { void navigate({ search: { ...search, page: search.page - 1 } }) }}>Anterior</Button><span>Página {search.page} de {Math.max(1, Math.ceil(data.total / data.pageSize))}</span><Button variant="outline" disabled={search.page * data.pageSize >= data.total} onClick={() => { void navigate({ search: { ...search, page: search.page + 1 } }) }}>Próxima</Button></nav>
        </>}
      </div>
    </section>
  </>
}
