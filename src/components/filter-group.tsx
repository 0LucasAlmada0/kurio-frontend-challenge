import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import type { CatalogFacets, CatalogSearch } from '@/api/contracts'
import { priceParam, selections, type CatalogChange } from '@/features/catalog/search'
import { ethToWei, weiToEth } from '@/lib/eth'
import { Button } from './ui/button'
import { Icon } from './icon'

export function FilterGroup({ title, children, disabled = true }: { title: string; children: ReactNode; disabled?: boolean }) {
  return <fieldset className="filter-group" disabled={disabled}><legend>{title}</legend>{children}</fieldset>
}

export function FilterOption({ label, ...props }: { label: string } & Omit<ComponentProps<'input'>, 'type' | 'children'>) {
  return <label className="filter-option"><input type="checkbox" {...props} /><span>{label}</span></label>
}

type FiltersProps = { search: CatalogSearch; change: (change: CatalogChange) => void; clear: () => void; facets?: CatalogFacets; loading: boolean; error: boolean; retry: () => void }
function PriceFilter({ search, change, facets }: Pick<FiltersProps, 'search' | 'change' | 'facets'>) {
  const id = useId()
  const [min, setMin] = useState(search.minPrice ?? '')
  const [max, setMax] = useState(search.maxPrice ?? '')
  const [error, setError] = useState('')
  const upper = [facets?.priceRange.max, search.minPrice, search.maxPrice].reduce<bigint>((maximum, value) => value && ethToWei(value) > maximum ? ethToWei(value) : maximum, 0n)
  const lowerValue = priceParam(min.replace(',', '.'))
  const upperValue = priceParam(max.replace(',', '.'))
  const lowerWei = lowerValue ? ethToWei(lowerValue) : 0n
  const upperWei = upperValue ? ethToWei(upperValue) : upper
  const cent = 10n ** 16n
  const steps = Number(upper > 0n && upper <= 10000n * cent ? (upper + cent - 1n) / cent : 1000n)
  const position = (value: bigint) => upper ? Number(((value > upper ? upper : value) * BigInt(steps) + upper / 2n) / upper) : 0
  function slide(which: 'min' | 'max', position: string) {
    const value = BigInt(position) === BigInt(steps) ? upper : upper <= 10000n * cent ? BigInt(position) * cent : upper * BigInt(position) / BigInt(steps)
    if (which === 'min') setMin(weiToEth(value > upperWei ? upperWei : value))
    else setMax(weiToEth(value < lowerWei ? lowerWei : value))
    setError('')
  }
  return <form noValidate onSubmit={(event) => {
    event.preventDefault()
    const minPrice = priceParam(min.replace(',', '.'))
    const maxPrice = priceParam(max.replace(',', '.'))
    const message = (min.trim() && !minPrice) || (max.trim() && !maxPrice) ? 'Use um preço positivo ou zero, com até 18 casas decimais.' : minPrice && maxPrice && ethToWei(minPrice) > ethToWei(maxPrice) ? 'O preço mínimo deve ser menor ou igual ao máximo.' : ''
    setError(message)
    if (!message) change({ minPrice, maxPrice })
  }}>{facets && upper > 0n && <><div className="price-slider" role="group" aria-label="Intervalo de preço em ETH"><div className="price-slider-track"><span style={{ left: `${position(lowerWei) * 100 / steps}%`, right: `${100 - position(upperWei) * 100 / steps}%` }} /></div><input type="range" min={0} max={steps} value={position(lowerWei)} onChange={(event) => slide('min', event.target.value)} aria-label="Limite inferior de preço em ETH" aria-valuetext={`${lowerValue ?? '0'} ETH`} aria-describedby={`${id}-hint`} /><input type="range" min={0} max={steps} value={position(upperWei)} onChange={(event) => slide('max', event.target.value)} aria-label="Limite superior de preço em ETH" aria-valuetext={`${upperValue ?? weiToEth(upper)} ETH`} aria-describedby={`${id}-hint`} /></div><p className="filter-price-value">Preço: {(lowerValue ?? '0').replace('.', ',')} — {(upperValue ?? weiToEth(upper)).replace('.', ',')} ETH</p></>}<p id={`${id}-hint`} className="sr-only">Ajuste os dois limites com as setas ou digite valores exatos nos campos. Confirme em Aplicar.</p><div className="filter-price-fields"><input value={min} onChange={(event) => setMin(event.target.value)} placeholder="Mín." aria-label="Preço mínimo em ETH" inputMode="decimal" maxLength={43} aria-invalid={!!error} aria-describedby={error ? id : undefined} /><span>—</span><input value={max} onChange={(event) => setMax(event.target.value)} placeholder="Máx." aria-label="Preço máximo em ETH" inputMode="decimal" maxLength={43} aria-invalid={!!error} aria-describedby={error ? id : undefined} /></div>{error && <p id={id} role="alert" className="filter-error">{error}</p>}<button className="filter-apply">Aplicar</button></form>
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
    <FilterGroup title="Faixa de preço · ETH" disabled={false}><PriceFilter key={`${search.minPrice}-${search.maxPrice}`} search={search} change={change} facets={facets} /></FilterGroup>
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
    const body = element.querySelector<HTMLElement>('.filter-drawer-body')!
    const resize = new ResizeObserver(() => {
      const focused = document.activeElement
      if (focused instanceof HTMLElement && body.contains(focused)) focused.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    })
    resize.observe(body)
    const fitViewport = () => { element.style.height = `${window.visualViewport?.height ?? innerHeight}px`; element.style.top = `${window.visualViewport?.offsetTop ?? 0}px` }
    fitViewport()
    window.visualViewport?.addEventListener('resize', fitViewport)
    window.visualViewport?.addEventListener('scroll', fitViewport)
    return () => { resize.disconnect(); window.visualViewport?.removeEventListener('resize', fitViewport); window.visualViewport?.removeEventListener('scroll', fitViewport); element.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [open])
  return <dialog className="filter-dialog" ref={ref} aria-label="Filtros de NFTs" onClose={close} onKeyDown={(event) => {
    if (event.key !== 'Tab') return
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]')].filter((element) => element.getClientRects().length)
    const first = controls[0]
    const last = controls[controls.length - 1]
    if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus() }
  }}><div className="filter-drawer-header"><button className="filter-close" aria-label="Fechar filtros" onClick={close}>×</button></div><div className="filter-drawer-body">{children}</div><div className="filter-drawer-footer"><Button className="filter-results" onClick={close}>Ver resultados</Button></div></dialog>
}
