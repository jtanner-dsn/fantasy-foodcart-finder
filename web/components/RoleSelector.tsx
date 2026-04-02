'use client';

import { useRouter } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import type { Role } from '@/lib/session';

export default function RoleSelector() {
  const { role, setRole } = useRole();
  const router = useRouter();

  function handleSelect(selected: Role) {
    setRole(selected);
    router.push(`/${selected}`);
  }

  return (
    <div className="flex items-center gap-1 rounded-lg bg-stone-800 p-1">
      <button
        onClick={() => handleSelect('traveler')}
        className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3 ${
          role === 'traveler'
            ? 'bg-amber-600 text-stone-100 shadow-inner'
            : 'text-stone-400 hover:text-stone-200'
        }`}
        aria-pressed={role === 'traveler'}
      >
        <span className="hidden sm:inline">I am a </span>Traveler
      </button>
      <button
        onClick={() => handleSelect('merchant')}
        className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3 ${
          role === 'merchant'
            ? 'bg-amber-600 text-stone-100 shadow-inner'
            : 'text-stone-400 hover:text-stone-200'
        }`}
        aria-pressed={role === 'merchant'}
      >
        <span className="hidden sm:inline">I am a </span>Merchant
      </button>
    </div>
  );
}
