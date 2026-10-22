import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import type { CatalogFacets, CatalogSearch } from '@/api/contracts'
import { priceParam, selections, type CatalogChange } from '@/features/catalog/search'
import { ethToWei } from '@/lib/eth'
import { Button } from './ui/button'
import { Icon } from './icon'

export function FilterGroup({ title, children, disabled = true }: { title: string; children: ReactNode; disabled?: boolean }) {
  return <fieldset className="filter-group" disabled={disabled}><legend>{title}</legend>{children}</fieldset>
}

export function FilterOption({ label, ...props }: { label: string } & Omit<ComponentProps<'input'>, 'type' | 'children'>) {
  return <label className="filter-option"><input type="checkbox" {...props} /><span>{label}</span></label>
}

type FiltersProps = { search: CatalogSearch; change: (change: CatalogChange) => void; clear: () => void; facets?: CatalogFacets; loading: boolean; error: boolean; retry: () => void }
function PriceFilter({ search, change }: Pick<FiltersProps, 'search' | 'change'>) {
  const id = useId()
  const [min, setMin] = useState(search.minPrice ?? '')
  const [max, setMax] = useState(search.maxPrice ?? '')
  const [error, setError] = useState('')
  return <form noValidate onSubmit={(event) => {
    event.preventDefault()
    const minPrice = priceParam(min.replace(',', '.'))
    const maxPrice = priceParam(max.replace(',', '.'))
    const message = (min.trim() && !minPrice) || (max.trim() && !maxPrice) ? 'Use um preço positivo ou zero, com até 18 casas decimais.' : minPrice && maxPrice && ethToWei(minPrice) > ethToWei(maxPrice) ? 'O preço mínimo deve ser menor ou igual ao máximo.' : ''
    setError(message)
    if (!message) change({ minPrice, maxPrice })
  }}><div className="filter-price-fields"><input value={min} onChange={(event) => setMin(event.target.value)} placeholder="Mín." aria-label="Preço mínimo em ETH" inputMode="decimal" maxLength={43} aria-invalid={!!error} aria-describedby={error ? id : undefined} /><span>—</span><input value={max} onChange={(event) => setMax(event.target.value)} placeholder="Máx." aria-label="Preço máximo em ETH" inputMode="decimal" maxLength={43} aria-invalid={!!error} aria-describedby={error ? id : undefined} /></div>{error && <p id={id} role="alert" className="filter-error">{error}</p>}<button className="filter-apply">Aplicar</button></form>
}
export function CatalogFilters({ search, change, clear, facets, loading, error, retry }: FiltersProps) {
  const id = useId()
  const active = Object.entries(search).some(([key, value]) => key === 'page' ? value !== 1 : key === 'sort' ? value !== 'name' : !!value)
  function toggle(field: 'collections' | 'rarities', value: string, checked: boolean) {
    change((previous) => ({ [field]: (checked ? [...selections(previous[field]), value] : selections(previous[field]).filter((item) => item !== value)).join(',') || undefined }))
  }
  return <aside className="catalog-sidebar" aria-label="Filtros do catálogo">
    <div className="filter-heading"><h2>Filtros</h2><button disabled={!active} onClick={clear}>Limpar tudo</button></div>
    {loading && <p role="status">Carregando filtros…</p>}{error && <div role="status"><p>Não foi possível carregar os filtros.</p><Button variant="outline" onClick={retry}>Recarregar filtros</Button></div>}
    <FilterGroup title="Coleções" disabled={loading || !facets}>{facets?.collections.map((value) => <FilterOption key={value} label={value} checked={selections(search.collections).includes(value)} onChange={(event) => toggle('collections', value, event.target.checked)} />)}</FilterGroup>
    <FilterGroup title="Raridade" disabled={loading || !facets}>{facets?.rarities.map((value) => <FilterOption key={value} label={value[0]!.toUpperCase() + value.slice(1)} checked={selections(search.rarities).includes(value)} onChange={(event) => toggle('rarities', value, event.target.checked)} />)}</FilterGroup>
    <FilterGroup title="Faixa de preço · ETH" disabled={false}><PriceFilter key={`${search.minPrice}-${search.maxPrice}`} search={search} change={change} /></FilterGroup>
    <FilterGroup title="Disponibilidade" disabled={false}>{([['', 'Todos'], ['available', 'Disponíveis'], ['sold-out', 'Esgotados']] as const).map(([value, label]) => <label className="filter-option" key={value}><input type="radio" name={`${id}-availability`} checked={(search.availability ?? '') === value} onChange={() => change({ availability: value || undefined })} /><span>{label}</span></label>)}</FilterGroup>
    <p className="filter-notice"><Icon name="filters" />Filtros combinados com a busca.</p>
  </aside>
}
export function FilterDrawer({ open, close, children }: { open: boolean; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (!open) return
    const element = ref.current!
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    element.showModal()
    document.body.style.overflow = 'hidden'
    return () => { element.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus() }
  }, [open])
  return <dialog className="filter-dialog" ref={ref} aria-label="Filtros de NFTs" onClose={close} onKeyDown={(event) => {
    if (event.key !== 'Tab') return
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]')].filter((element) => element.getClientRects().length)
    const first = controls[0]
    const last = controls[controls.length - 1]
    if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus() }
  }}><button className="filter-close" aria-label="Fechar filtros" onClick={close}>×</button>{children}<Button className="filter-results" onClick={close}>Ver resultados</Button></dialog>
}
