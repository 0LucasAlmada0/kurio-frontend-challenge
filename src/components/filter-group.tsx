import type { ComponentProps, ReactNode } from 'react'
import { Icon } from './icon'

export function FilterGroup({ title, children, disabled = true }: { title: string; children: ReactNode; disabled?: boolean }) {
  return <fieldset className="filter-group" disabled={disabled}><legend>{title}</legend>{children}</fieldset>
}

export function FilterOption({ label, ...props }: { label: string } & Omit<ComponentProps<'input'>, 'type' | 'children'>) {
  return <label className="filter-option"><input type="checkbox" {...props} /><span>{label}</span></label>
}

export function CatalogFilters() {
  return <aside className="catalog-sidebar" aria-label="Filtros em preparação">
    <div className="filter-heading"><h2>Filtros</h2><span>Em breve</span></div>
    <FilterGroup title="Coleções"><FilterOption label="Arte digital" /><FilterOption label="Fotografia" /><FilterOption label="Música" /><FilterOption label="Arte 3D" /><FilterOption label="Colecionáveis" /><FilterOption label="Generativa" /><FilterOption label="Jogos" /><FilterOption label="Assinaturas" /><FilterOption label="Utilidade" /></FilterGroup>
    <FilterGroup title="Faixa de preço"><input type="range" aria-label="Faixa de preço indisponível" /><div className="filter-price-fields"><input placeholder="Mín." aria-label="Preço mínimo" /><span>—</span><input placeholder="Máx." aria-label="Preço máximo" /></div><button className="filter-apply" disabled>Aplicar</button></FilterGroup>
    <FilterGroup title="Rede"><FilterOption label="Ethereum" /><FilterOption label="Polygon" /><FilterOption label="Solana" /></FilterGroup>
    <p className="filter-notice"><Icon name="filters" />Filtros em preparação</p>
  </aside>
}
