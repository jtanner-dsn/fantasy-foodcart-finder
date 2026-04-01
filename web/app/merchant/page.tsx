'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRole } from '@/context/RoleContext';
import { listMyCarts, deleteCart, type Cart } from '@/lib/api';

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
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-400">Merchant&rsquo;s Guild</h1>
          <p className="mt-1 text-stone-400">Manage your carts and stalls</p>
        </div>
        <Link
          href="/merchant/new"
          className="rounded-lg bg-amber-400 hover:bg-amber-300 px-5 py-2 font-semibold text-stone-900"
        >
          + New Listing
        </Link>
      </div>

      <div className="mt-10">
        {loading && (
          <p className="text-stone-500 text-center py-16">Consulting the guild ledger…</p>
        )}

        {!loading && error && (
          <p className="text-red-400 text-center py-16">{error}</p>
        )}

        {!loading && !error && carts.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-600 bg-stone-800 py-24 gap-4">
            <p className="text-stone-400 text-lg">No listings yet.</p>
            <Link
              href="/merchant/new"
              className="rounded-lg bg-amber-400 hover:bg-amber-300 px-5 py-2 font-semibold text-stone-900"
            >
              Register your first cart
            </Link>
          </div>
        )}

        {!loading && !error && carts.length > 0 && (
          <ul className="space-y-4">
            {carts.map((cart) => (
              <li
                key={cart.id}
                className="rounded-xl border border-stone-700 bg-stone-800 px-6 py-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-lg font-semibold text-stone-100 truncate">
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

                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/merchant/${cart.id}/edit`}
                      className="rounded-lg border border-stone-600 hover:border-amber-400 hover:text-amber-400 px-3 py-1.5 text-sm text-stone-300"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(cart)}
                      disabled={deletingId === cart.id}
                      className="rounded-lg border border-stone-600 hover:border-red-500 hover:text-red-400 px-3 py-1.5 text-sm text-stone-300 disabled:opacity-50"
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
