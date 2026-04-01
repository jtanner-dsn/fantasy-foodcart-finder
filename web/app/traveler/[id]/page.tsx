'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCart, Cart } from '@/lib/api';

const CartMap = dynamic(() => import('@/components/CartMap'), { ssr: false });

export default function CartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getCart(id)
      .then(setCart)
      .catch(() => setError('Cart not found'));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-red-400">{error}</p>
        <button onClick={() => router.back()} className="mt-4 text-amber-400 hover:underline text-sm">
          ← Back to map
        </button>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-stone-500 text-sm">Loading…</p>
      </div>
    );
  }

  const hasLocation = cart.location_x !== null && cart.location_y !== null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      {/* Back link */}
      <button
        onClick={() => router.push('/traveler')}
        className="text-amber-400 hover:text-amber-300 text-sm"
      >
        ← Back to map
      </button>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-amber-400">{cart.name}</h1>
          <span
            className={`text-sm px-2 py-0.5 rounded-full font-medium ${
              cart.is_open
                ? 'bg-emerald-900/60 text-emerald-400'
                : 'bg-stone-700 text-stone-400'
            }`}
          >
            {cart.is_open ? 'Open' : 'Closed'}
          </span>
        </div>
        {cart.cuisine_type && (
          <p className="text-amber-500 font-medium">{cart.cuisine_type}</p>
        )}
        {cart.description && (
          <p className="text-stone-300 mt-2">{cart.description}</p>
        )}
      </div>

      {/* Location info */}
      <div className="rounded-xl bg-stone-800 border border-stone-700 p-5 space-y-2">
        <h2 className="text-stone-200 font-semibold">Location</h2>
        {cart.district && (
          <p className="text-stone-400 text-sm">
            <span className="text-stone-500">District:</span>{' '}
            <span className="text-stone-300">{cart.district}</span>
          </p>
        )}
        {cart.landmark_desc && (
          <p className="text-stone-400 text-sm">
            <span className="text-stone-500">Landmark:</span>{' '}
            <span className="text-stone-300">{cart.landmark_desc}</span>
          </p>
        )}
        {cart.hours_text && (
          <p className="text-stone-400 text-sm">
            <span className="text-stone-500">Hours:</span>{' '}
            <span className="text-stone-300">{cart.hours_text}</span>
          </p>
        )}
        {hasLocation && (
          <div className="h-56 mt-3 rounded-lg overflow-hidden border border-stone-600">
            <CartMap carts={[cart]} selectedId={cart.id} onSelect={() => {}} />
          </div>
        )}
        {!hasLocation && (
          <p className="text-stone-600 text-xs italic">No map pin set for this stall.</p>
        )}
      </div>

      {/* Menu */}
      <div className="space-y-3">
        <h2 className="text-stone-200 font-semibold">
          Bill of Fare
          {cart.menu_items && cart.menu_items.length > 0 && (
            <span className="ml-2 text-stone-500 font-normal text-sm">
              ({cart.menu_items.length} item{cart.menu_items.length !== 1 ? 's' : ''})
            </span>
          )}
        </h2>

        {(!cart.menu_items || cart.menu_items.length === 0) && (
          <p className="text-stone-500 text-sm italic">
            No items listed yet — ask the merchant what&apos;s on offer.
          </p>
        )}

        {cart.menu_items && cart.menu_items.length > 0 && (
          <ul className="divide-y divide-stone-700 rounded-xl border border-stone-700 overflow-hidden">
            {cart.menu_items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-4 bg-stone-800">
                <div className="space-y-0.5">
                  <p className="text-stone-100 font-medium">{item.name}</p>
                  {item.description && (
                    <p className="text-stone-400 text-sm">{item.description}</p>
                  )}
                </div>
                <span className="shrink-0 text-amber-400 font-semibold tabular-nums">
                  {item.price === 0 ? 'Ask' : `${item.price.toFixed(2)} gp`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
