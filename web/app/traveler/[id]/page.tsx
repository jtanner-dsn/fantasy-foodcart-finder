'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCart, getCartRatings, upsertRating, Cart, RatingsResponse } from '@/lib/api';
import { useRole } from '@/context/RoleContext';

const CartMap = dynamic(() => import('@/components/CartMap'), { ssr: false });

function StarPicker({ value, onChange }: { value: number; onChange: (s: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          aria-label={`${s} star${s !== 1 ? 's' : ''}`}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className={`text-2xl transition-colors ${
            s <= (hovered || value) ? 'text-amber-400' : 'text-stone-600'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ avg, count }: { avg: number | null; count: number }) {
  if (count === 0) return <span className="text-stone-500 text-sm">No ratings yet</span>;
  return (
    <span className="text-amber-400 text-sm font-medium">
      {'★'.repeat(Math.round(avg ?? 0))}
      {'☆'.repeat(5 - Math.round(avg ?? 0))}{' '}
      <span className="text-stone-400 font-normal">{avg?.toFixed(1)} · {count} {count === 1 ? 'rating' : 'ratings'}</span>
    </span>
  );
}

export default function CartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { sessionToken } = useRole();

  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ratingsData, setRatingsData] = useState<RatingsResponse | null>(null);

  const [selectedStars, setSelectedStars] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getCart(id)
      .then(setCart)
      .catch(() => setError('Cart not found'));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getCartRatings(id, sessionToken || undefined)
      .then((data) => {
        setRatingsData(data);
        if (data.my_rating) {
          setSelectedStars(data.my_rating.stars);
          setReviewText(data.my_rating.review_text ?? '');
        }
      })
      .catch(() => {});
  }, [id, sessionToken]);

  async function handleSubmitRating(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionToken || !id || selectedStars === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await upsertRating(id, sessionToken, selectedStars, reviewText);
      const updated = await getCartRatings(id, sessionToken);
      setRatingsData(updated);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save rating');
    } finally {
      setSubmitting(false);
    }
  }

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
  const isOwnCart = sessionToken !== '' && sessionToken === cart.operator_id;
  const canRate = sessionToken !== '' && !isOwnCart;

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
        {ratingsData !== null && (
          <div className="pt-1">
            <StarDisplay avg={ratingsData.avg_stars} count={ratingsData.count} />
          </div>
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

      {/* Ratings */}
      <div className="space-y-4">
        <h2 className="text-stone-200 font-semibold">Ratings &amp; Reviews</h2>

        {/* Rating form for travelers */}
        {canRate && (
          <form onSubmit={handleSubmitRating} className="rounded-xl bg-stone-800 border border-stone-700 p-5 space-y-4">
            <p className="text-stone-400 text-sm font-medium">
              {ratingsData?.my_rating ? 'Update your rating' : 'Leave a rating'}
            </p>
            <StarPicker value={selectedStars} onChange={setSelectedStars} />
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience (optional)"
              rows={3}
              className="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-200 text-sm placeholder:text-stone-500 focus:outline-none focus:border-amber-500 resize-none"
            />
            {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
            <button
              type="submit"
              disabled={submitting || selectedStars === 0}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-stone-900 font-semibold text-sm transition-colors"
            >
              {submitting ? 'Saving…' : ratingsData?.my_rating ? 'Update Review' : 'Submit Review'}
            </button>
          </form>
        )}

        {isOwnCart && (
          <p className="text-stone-500 text-sm italic">You operate this stall — travelers may rate it.</p>
        )}

        {/* Reviews list */}
        {ratingsData && ratingsData.count > 0 && (
          <ul className="space-y-3">
            {ratingsData.ratings.map((rating) => (
              <li key={rating.id} className="rounded-xl bg-stone-800 border border-stone-700 px-5 py-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400">{'★'.repeat(rating.stars)}{'☆'.repeat(5 - rating.stars)}</span>
                  {rating.traveler_id === sessionToken && (
                    <span className="text-xs text-stone-500">(your rating)</span>
                  )}
                </div>
                {rating.review_text && (
                  <p className="text-stone-300 text-sm">{rating.review_text}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        {ratingsData && ratingsData.count === 0 && !canRate && !isOwnCart && (
          <p className="text-stone-500 text-sm italic">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}
