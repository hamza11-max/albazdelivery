'use client'

import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { StorefrontCategory } from '@/lib/storefront/catalog'

export function CategoryFilter({
  categories,
  activeCategory,
  initialSearch,
  initialSort,
  accent,
}: {
  categories: StorefrontCategory[]
  activeCategory?: string | null
  initialSearch?: string | null
  initialSort?: string | null
  accent: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialSearch || '')

  const selected = useMemo(() => activeCategory || '', [activeCategory])

  function update(next: { category?: string; search?: string; sort?: string }) {
    const params = new URLSearchParams(searchParams.toString())
    if ('category' in next) {
      if (next.category) params.set('category', next.category)
      else params.delete('category')
    }
    if ('search' in next) {
      if (next.search?.trim()) params.set('search', next.search.trim())
      else params.delete('search')
    }
    if ('sort' in next) {
      if (next.sort && next.sort !== 'name_asc') params.set('sort', next.sort)
      else params.delete('sort')
    }
    const query = params.toString()
    router.push(query ? `/menu?${query}` : '/menu')
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          update({ search })
        }}
      >
        <label className="sr-only" htmlFor="storefront-search">
          Search products
        </label>
        <input
          id="storefront-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products"
          className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2"
          style={{ '--tw-ring-color': accent } as CSSProperties}
        />
        <button
          type="submit"
          className="rounded-full px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          Search
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Categories">
        <button
          type="button"
          onClick={() => update({ category: '' })}
          className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
            !selected ? 'text-white' : 'border-slate-200 bg-white text-slate-700'
          }`}
          style={!selected ? { backgroundColor: accent, borderColor: accent } : undefined}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.slug}
            type="button"
            onClick={() => update({ category: category.slug })}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
              selected === category.slug
                ? 'text-white'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
            style={
              selected === category.slug
                ? { backgroundColor: accent, borderColor: accent }
                : undefined
            }
          >
            {category.name} ({category.productCount})
          </button>
        ))}
      </div>

      <label className="block text-xs font-medium text-slate-600">
        Sort
        <select
          value={initialSort || 'name_asc'}
          onChange={(event) => update({ sort: event.target.value })}
          className="mt-1 block w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        >
          <option value="name_asc">Name</option>
          <option value="popular">Popular</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </label>
    </div>
  )
}
