'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { browseAllCarts, Cart, CartFilter } from '@/lib/api';

const CartMap = dynamic(() => import('@/components/CartMap'), { ssr: false });

const DISTRICTS = ['Midheath', 'Peridozys', 'Beerside', 'Westheath', 'Aspenlane', 'Oakcorner'];

export default function TravelerPage() {
  const router = useRouter();
  const [allCarts, setAllCarts] = useState<Cart[]>([]);
  const [filter, setFilter] = useState<CartFilter>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    browseAllCarts(filter)
      .then(setAllCarts)
      .catch(() => setError('Could not reach the API — is the Go server running?'))
      .finally(() => setLoading(false));
  }, [filter]);

  function handleSelect(id: string) {
    setSelectedId(id);
    document.getElementById(`cart-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const hasFilters = !!(filter.district || filter.open);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 3.25rem)' }}>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-stone-900 border-b border-stone-700 sm:px-6">
        <span className="text-stone-400 text-sm font-medium">Filter:</span>

        <select
          value={filter.district ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, district: e.target.value || undefined }))}
          className="bg-stone-800 border border-stone-600 text-stone-200 text-sm rounded px-2 py-1 focus:outline-none focus:border-amber-400"
        >
          <option value="">All Districts</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-stone-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filter.open ?? false}
            onChange={(e) => setFilter((f) => ({ ...f, open: e.target.checked || undefined }))}
            className="accent-amber-400"
          />
          Open now
        </label>

        {hasFilters && (
          <button
            onClick={() => setFilter({})}
            className="text-xs text-amber-400 hover:text-amber-300 underline"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-stone-500 text-xs">
          {loading ? 'Searching…' : `${allCarts.length} stall${allCarts.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-900/40 text-red-300 text-sm border-b border-red-800">
          ⚠ {error}
        </div>
      )}

      {/* Main content — stacked on mobile, side-by-side on md+ */}
      <div className="flex flex-col flex-1 overflow-hidden md:flex-row">
        {/* Map — fixed height on mobile, flex-1 on desktop */}
        <div className="h-56 shrink-0 p-3 sm:h-72 md:h-auto md:flex-1 md:p-4">
          <CartMap
            carts={allCarts}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>

        {/* Cart list — scrollable panel */}
        <div className="flex flex-col border-t border-stone-700 overflow-y-auto md:w-80 md:border-l md:border-t-0">
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <h2 className="section-header">Stalls &amp; Carts</h2>
          </div>

          {loading && (
            <div className="flex flex-col gap-2 px-2 pb-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg px-3 py-3 bg-stone-800 border border-transparent space-y-2">
                  <div className="flex justify-between gap-2">
                    <div className="skeleton h-4 w-2/3" />
                    <div className="skeleton h-4 w-12" />
                  </div>
                  <div className="skeleton h-3 w-1/3" />
                </div>
              ))}
            </div>
          )}

          {!loading && allCarts.length === 0 && (
            <div className="px-4 py-8 text-center space-y-1">
              <p className="text-stone-400 text-sm">
                {hasFilters
                  ? 'No stalls match your filters.'
                  : 'The market square is quiet…'}
              </p>
              {hasFilters && (
                <button
                  onClick={() => setFilter({})}
                  className="text-xs text-amber-400 hover:text-amber-300 underline"
                >
                  Clear filters
                </button>
              )}

            </div>
          )}

          {!loading && allCarts.length > 0 && (
            <ul className="flex flex-col gap-1 px-2 pb-4 animate-fadeIn">
              {allCarts.map((cart) => (
                <li key={cart.id} id={`cart-${cart.id}`}>
                  <button
                    onClick={() => {
                      setSelectedId(cart.id);
                      router.push(`/traveler/${cart.id}`);
                    }}
                    className={`w-full text-left rounded-lg px-3 py-3 transition-colors ${
                      selectedId === cart.id
                        ? 'bg-amber-900/40 border border-amber-600'
                        : 'bg-stone-800 border border-transparent hover:border-stone-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-stone-100 text-sm leading-snug">{cart.name}</span>
                      <span
                        className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          cart.is_open
                            ? 'bg-emerald-900/60 text-emerald-400'
                            : 'bg-stone-700 text-stone-400'
                        }`}
                      >
                        {cart.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    {cart.cuisine_type && (
                      <p className="text-xs text-amber-500 mt-0.5">{cart.cuisine_type}</p>
                    )}
                    {cart.district && (
                      <p className="text-xs text-stone-500 mt-0.5">{cart.district}</p>
                    )}
                    {cart.rating_count > 0 && (
                      <p className="text-xs text-amber-400 mt-0.5">
                        {'★'.repeat(Math.round(cart.avg_stars ?? 0))}
                        {'☆'.repeat(5 - Math.round(cart.avg_stars ?? 0))}{' '}
                        <span className="text-stone-500">{cart.avg_stars?.toFixed(1)} ({cart.rating_count})</span>
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
