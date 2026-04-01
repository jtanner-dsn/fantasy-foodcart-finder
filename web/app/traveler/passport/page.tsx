'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPassport, getLeaderboard, PassportResponse, LeaderboardEntry } from '@/lib/api';
import { useRole } from '@/context/RoleContext';

function travelerHandle(id: string): string {
  return 'Adventurer #' + id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export default function PassportPage() {
  const { sessionToken } = useRole();
  const [passport, setPassport] = useState<PassportResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionToken) return;
    Promise.all([getPassport(sessionToken), getLeaderboard()])
      .then(([p, l]) => {
        setPassport(p);
        setLeaderboard(l);
      })
      .catch(() => setError('Could not reach the API — is the Go server running?'))
      .finally(() => setLoading(false));
  }, [sessionToken]);

  if (!sessionToken) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amber-400">My Passport</h1>
        <Link href="/traveler" className="text-amber-400 hover:text-amber-300 text-sm">
          ← Back to map
        </Link>
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {loading && (
        <p className="text-stone-500 text-sm">Loading…</p>
      )}

      {!loading && passport && (
        <>
          {/* Stamp count summary */}
          <div className="rounded-xl bg-stone-800 border border-stone-700 p-6 flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-amber-400">{passport.stamp_count}</p>
              <p className="text-stone-400 text-sm mt-1">
                {passport.stamp_count === 1 ? 'Stamp' : 'Stamps'}
              </p>
            </div>
            {passport.stamp_count === 0 && (
              <p className="text-stone-400 text-sm">
                Rate a cart to earn your first stamp and begin your passport journey.
              </p>
            )}
          </div>

          {/* Badges */}
          <div className="space-y-4">
            <h2 className="text-stone-200 font-semibold text-lg">Badges Earned</h2>
            {passport.badges.length === 0 && (
              <p className="text-stone-500 text-sm italic">
                No badges yet — keep exploring Misthaven!
              </p>
            )}
            {passport.badges.length > 0 && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {passport.badges.map((badge) => (
                  <li
                    key={badge.id}
                    className="rounded-xl bg-stone-800 border border-amber-700/50 px-5 py-4 space-y-1"
                  >
                    <p className="text-amber-400 font-semibold">{badge.name}</p>
                    <p className="text-stone-400 text-sm">{badge.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Stamps */}
          {passport.stamps.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-stone-200 font-semibold text-lg">Visited Stalls</h2>
              <ul className="divide-y divide-stone-700 rounded-xl border border-stone-700 overflow-hidden">
                {passport.stamps.map((stamp) => (
                  <li key={stamp.id} className="flex items-center justify-between gap-4 px-5 py-4 bg-stone-800">
                    <div className="space-y-0.5">
                      <Link
                        href={`/traveler/${stamp.cart_id}`}
                        className="text-stone-100 font-medium hover:text-amber-400 transition-colors"
                      >
                        {stamp.cart_name}
                      </Link>
                      <div className="flex gap-3 text-xs text-stone-500">
                        {stamp.cart_cuisine && <span>{stamp.cart_cuisine}</span>}
                        {stamp.district && <span>{stamp.district}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 text-amber-500 text-lg" aria-label="Stamp">✦</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Leaderboard */}
      {!loading && leaderboard.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-stone-200 font-semibold text-lg">City Leaderboard</h2>
          <p className="text-stone-500 text-xs">Top 10 adventurers by stamp count</p>
          <ol className="divide-y divide-stone-700 rounded-xl border border-stone-700 overflow-hidden">
            {leaderboard.map((entry) => {
              const isMe = entry.traveler_id === sessionToken;
              return (
                <li
                  key={entry.traveler_id}
                  className={`flex items-center gap-4 px-5 py-3 ${isMe ? 'bg-amber-900/30' : 'bg-stone-800'}`}
                >
                  <span className={`w-6 text-center font-bold tabular-nums ${entry.rank <= 3 ? 'text-amber-400' : 'text-stone-500'}`}>
                    {entry.rank}
                  </span>
                  <span className={`flex-1 text-sm ${isMe ? 'text-amber-300 font-semibold' : 'text-stone-300'}`}>
                    {travelerHandle(entry.traveler_id)}{isMe && ' (you)'}
                  </span>
                  <span className="text-stone-400 text-sm tabular-nums">
                    {entry.stamp_count} {entry.stamp_count === 1 ? 'stamp' : 'stamps'}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
