'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRole } from '@/context/RoleContext';
import { listMyCarts, deleteCart, type Cart } from '@/lib/api';

function CartSkeleton() {
  return (
    <li className="rounded-xl border border-stone-700 bg-stone-800 px-6 py-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <div className="skeleton h-5 w-48" />
            <div className="skeleton h-4 w-14 rounded-full" />
          </div>
          <div className="skeleton h-3 w-28" />
          <div className="skeleton h-3 w-full max-w-sm" />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="skeleton h-8 w-14 rounded-lg" />
          <div className="skeleton h-8 w-16 rounded-lg" />
        </div>
      </div>
    </li>
  );
}

export default function MerchantPage() {
  const { sessionToken } = useRole();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionToken) return;
    listMyCarts(sessionToken)
      .then(setCarts)
      .catch(() => setError('Could not reach the Misthaven API.'))
      .finally(() => setLoading(false));
  }, [sessionToken]);

  const handleDelete = async (cart: Cart) => {
    if (!confirm(`Remove "${cart.name}" from the guild ledger? This cannot be undone.`)) return;
    setDeletingId(cart.id);
    try {
      await deleteCart(cart.id, sessionToken);
      setCarts((prev) => prev.filter((c) => c.id !== cart.id));
    } catch {
      alert('Failed to remove the cart. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Merchant&rsquo;s Guild</h1>
          <p className="mt-1 text-stone-400 text-sm sm:text-base">Manage your carts and stalls</p>
        </div>
        <Link
          href="/merchant/new"
          className="shrink-0 rounded-lg bg-amber-400 hover:bg-amber-300 px-4 py-2 font-semibold text-stone-900 text-sm sm:px-5 sm:text-base transition-colors"
        >
          + New Listing
        </Link>
      </div>

      <div className="mt-8 sm:mt-10">
        {loading && (
          <ul className="space-y-4">
            {[...Array(3)].map((_, i) => <CartSkeleton key={i} />)}
          </ul>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-800 bg-red-900/30 px-6 py-8 text-center space-y-2">
            <p className="text-red-300 font-medium">The guild ledger is unavailable.</p>
            <p className="text-red-400/70 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && carts.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-600 bg-stone-800 py-20 gap-4 text-center px-6">
            <p className="font-display text-xl text-stone-300">No listings yet.</p>
            <p className="text-stone-500 text-sm max-w-xs">
              Register your first cart or stall to appear on the Misthaven market map.
            </p>
            <Link
              href="/merchant/new"
              className="rounded-lg bg-amber-400 hover:bg-amber-300 px-5 py-2 font-semibold text-stone-900 transition-colors"
            >
              Register your first cart
            </Link>
          </div>
        )}

        {!loading && !error && carts.length > 0 && (
          <ul className="space-y-4 animate-fadeIn">
            {carts.map((cart) => (
              <li
                key={cart.id}
                className="rounded-xl border border-stone-700 bg-stone-800 px-4 py-4 sm:px-6 sm:py-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-base font-semibold text-stone-100 truncate sm:text-lg">
                        {cart.name}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          cart.is_open
                            ? 'bg-emerald-900 text-emerald-300'
                            : 'bg-stone-700 text-stone-400'
                        }`}
                      >
                        {cart.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    {cart.cuisine_type && (
                      <p className="mt-0.5 text-sm text-amber-400">{cart.cuisine_type}</p>
                    )}
                    {cart.description && (
                      <p className="mt-1 text-sm text-stone-400 line-clamp-2">
                        {cart.description}
                      </p>
                    )}
                    <div className="mt-2 flex gap-4 text-xs text-stone-500 flex-wrap">
                      {cart.district && <span>📍 {cart.district}</span>}
                      {cart.hours_text && <span>🕐 {cart.hours_text}</span>}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/merchant/${cart.id}/edit`}
                      className="rounded-lg border border-stone-600 hover:border-amber-400 hover:text-amber-400 px-3 py-1.5 text-sm text-stone-300 text-center transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(cart)}
                      disabled={deletingId === cart.id}
                      className="rounded-lg border border-stone-600 hover:border-red-500 hover:text-red-400 px-3 py-1.5 text-sm text-stone-300 disabled:opacity-50 transition-colors"
                    >
                      {deletingId === cart.id ? '…' : 'Remove'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
