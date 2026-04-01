'use client';

import { useEffect, useState } from 'react';

type Badge = {
  id: string;
  name: string;
  description: string;
  criteria_type: string;
  criteria_value: number;
};

export default function TravelerPage() {
  const [badges, setBadges] = useState<Badge[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8080/v1/badges')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setBadges)
      .catch(() => setError('Could not reach the API'));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-amber-400">The City of Misthaven</h1>
      <p className="mt-2 text-stone-400">Browse the wandering carts and stalls of the city</p>

      <div className="mt-10 flex items-center justify-center rounded-xl border border-dashed border-stone-600 bg-stone-800 py-24">
        <span className="text-stone-500 text-lg">Map coming soon</span>
      </div>

      {/* Stack validation — remove once real features are built */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-stone-300 mb-3">Stack Check — Badges from DB</h2>
        {error && (
          <p className="text-red-400 text-sm">{error} — is the Go API running?</p>
        )}
        {!badges && !error && (
          <p className="text-stone-500 text-sm">Loading...</p>
        )}
        {badges && (
          <ul className="space-y-2">
            {badges.map((b) => (
              <li key={b.id} className="rounded-lg bg-stone-800 px-4 py-3 flex justify-between items-center">
                <div>
                  <span className="font-medium text-amber-300">{b.name}</span>
                  <span className="ml-2 text-stone-400 text-sm">{b.description}</span>
                </div>
                <span className="text-xs text-stone-500">{b.criteria_type} ≥ {b.criteria_value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
