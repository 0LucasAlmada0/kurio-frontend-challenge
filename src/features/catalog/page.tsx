import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouterState, useSearch } from '@tanstack/react-router'
import type { CatalogSearch } from '@/api/contracts'
import { catalogFacetsOptions, catalogOptions } from './queries'
import { catalogDefaults, normalizeCatalogSearch, type CatalogChange } from './search'
import { NFTCard } from '@/components/nft-card'
import { CatalogLoading } from '@/components/loading'
import { ErrorState } from '@/components/error-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from '@/components/icon'
import { CatalogFilters, FilterDrawer } from '@/components/filter-group'

function SearchForm({ query, submit }: { query: string; submit: (q: string) => void }) {
  const [value, setValue] = useState(query)
  function onSubmit(event: FormEvent) { event.preventDefault(); submit(value.trim()) }
  return <form onSubmit={onSubmit} className="search-form" role="search"><label htmlFor="search" className="sr-only">Buscar NFTs</label><Icon name="search" /><Input id="search" type="search" placeholder="Explorar coleções" value={value} onChange={(event) => setValue(event.target.value)} /><Button type="submit" variant="outline">Buscar</Button></form>
}

export function CatalogPage({ backgroundSearch }: { backgroundSearch?: CatalogSearch } = {}) {
  const params = useSearch({ strict: false })
  const search = normalizeCatalogSearch({ ...(backgroundSearch ?? params) })
  const navigate = useNavigate({ from: '/' })
  const result = useQuery(catalogOptions(search))
  const facets = useQuery(catalogFacetsOptions())
  const [filtersOpen, setFiltersOpen] = useState(false)
  function change(patch: CatalogChange) { void navigate({ search: (previous) => { const current = normalizeCatalogSearch({ ...previous }); return normalizeCatalogSearch({ ...current, ...(typeof patch === 'function' ? patch(current) : patch), page: 1 }) }, resetScroll: false }) }
  function clear() { void navigate({ search: catalogDefaults, resetScroll: false }) }
  const filters = <CatalogFilters search={search} change={change} clear={clear} facets={facets.data} loading={facets.isPending} error={facets.isError} retry={() => { void facets.refetch() }} />
  const data = result.data
  const showSearch = useRouterState({ select: (state) => state.location.hash === 'search' })

  return <>
    <div className={`catalog-search${showSearch ? ' search-open' : ''}`}><SearchForm key={search.q} query={search.q} submit={(q) => change({ q })} /><button className="filter-toggle" aria-label="Abrir filtros" aria-haspopup="dialog" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(true)}><Icon name="filters" /></button></div>
    <FilterDrawer open={filtersOpen} close={() => setFiltersOpen(false)}>{filters}</FilterDrawer>
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-copy"><p>Bem-vindo à Kurio</p><h1 id="hero-heading"><span className="desktop-hero-title">SEJA DONO DO FUTURO<br />DA ARTE DIGITAL</span><span className="mobile-hero-title">SEJA DONO DA<br />CULTURA DIGITAL</span></h1><p className="hero-description">Descubra NFTs selecionados de criadores do mundo todo.</p><a href="#catalog" className="hero-cta">EXPLORAR <Icon name="arrow" /></a></div>
      <div className="hero-art" aria-hidden="true"><img src="/assets/nfts/emerald-ape.png" width="400" height="400" alt="" /><img src="/assets/nfts/violet-nomad.png" width="160" height="160" alt="" /></div>
      <div className="hero-dots" aria-hidden="true"><span /><span /><span /></div>
    </section>
    <section id="catalog" aria-labelledby="catalog-heading" className="catalog-layout">
      {filters}
      <div className="catalog-content">
        <div className="catalog-heading"><div className="catalog-tabs"><h2 id="catalog-heading">Todos os NFTs</h2><button disabled title="Novos lançamentos · em breve">Novos lançamentos</button><button disabled title="Em alta · em breve">Em alta</button></div><div className="sort-control"><label htmlFor="sort">Ordenar por:</label><select id="sort" value={search.sort} onChange={(event) => change({ sort: event.target.value as typeof search.sort })}><option value="name">Nome</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select><Icon name="chevron" /></div></div>
        <p className="catalog-count" aria-live="polite" aria-atomic="true">{data ? `${data.total} colecionáveis` : 'Explorando a coleção'}</p>
        {result.isPending ? <CatalogLoading /> : result.isError ? <ErrorState error={result.error} retry={() => { void result.refetch() }} /> : !data?.items.length ? <div className="state-panel" role="status"><h3>{data?.total ? 'Esta página não possui NFTs' : 'Nenhum NFT encontrado'}</h3><p>Tente outra busca ou combinação de filtros.</p><Button variant="outline" onClick={data?.total ? () => { void navigate({ search: { ...search, page: 1 }, resetScroll: false }) } : clear}>{data?.total ? 'Ir para primeira página' : 'Limpar filtros e busca'}</Button></div> : <>
          <p className="refresh-status" role="status">{result.isFetching ? 'Atualizando coleção…' : ''}</p>
          <div className="nft-grid">{data.items.map((nft, index) => <NFTCard key={nft.id} nft={nft} index={index} />)}</div>
          <nav className="pagination" aria-label="Páginas do catálogo"><Button variant="outline" disabled={search.page <= 1} onClick={() => { void navigate({ search: { ...search, page: search.page - 1 }, resetScroll: false }) }}>Anterior</Button><span>Página {search.page} de {Math.max(1, Math.ceil(data.total / data.pageSize))}</span><Button variant="outline" disabled={search.page * data.pageSize >= data.total} onClick={() => { void navigate({ search: { ...search, page: search.page + 1 }, resetScroll: false }) }}>Próxima</Button></nav>
        </>}
      </div>
    </section>
  </>
}
