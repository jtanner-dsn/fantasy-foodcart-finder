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

  const visibleCarts = allCarts;

  function handleSelect(id: string) {
    setSelectedId(id);
    document.getElementById(`cart-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-stone-900 border-b border-stone-700">
        <span className="text-stone-400 text-sm font-medium">Filter:</span>

        <select
          value={filter.district ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, district: e.target.value || undefined }))}
          className="bg-stone-800 border border-stone-600 text-stone-200 text-sm rounded px-2 py-1"
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

        {(filter.district || filter.open) && (
          <button
            onClick={() => setFilter({})}
            className="text-xs text-amber-400 hover:text-amber-300 underline"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-stone-500 text-xs">
          {loading ? 'Loading…' : `${visibleCarts.length} stall${visibleCarts.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-900/40 text-red-300 text-sm border-b border-red-800">
          {error}
        </div>
      )}

      {/* Main content: map + list side-by-side */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 p-4">
          <CartMap
            carts={visibleCarts}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>

        {/* Cart list sidebar */}
        <div className="w-80 flex flex-col border-l border-stone-700 overflow-y-auto">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-amber-400 font-semibold text-sm uppercase tracking-wider">
              Stalls &amp; Carts
            </h2>
          </div>

          {!loading && visibleCarts.length === 0 && (
            <p className="px-4 py-6 text-stone-500 text-sm">
              No stalls match your filters.
            </p>
          )}

          <ul className="flex flex-col gap-1 px-2 pb-4">
            {visibleCarts.map((cart) => (
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
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
