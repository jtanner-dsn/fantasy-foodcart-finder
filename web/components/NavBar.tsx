'use client';

import Link from 'next/link';
import RoleSelector from '@/components/RoleSelector';
import { useRole } from '@/context/RoleContext';

export default function NavBar() {
  const { role } = useRole();

  return (
    <nav className="flex items-center justify-between border-b border-stone-700 bg-stone-900 px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="text-lg font-semibold tracking-wide text-amber-400">
          Adventurer&rsquo;s Food-Cart Finder
        </span>
        {role === 'traveler' && (
          <Link
            href="/traveler/passport"
            className="text-sm text-stone-400 hover:text-amber-400 transition-colors"
          >
            My Passport
          </Link>
        )}
      </div>
      <RoleSelector />
    </nav>
  );
}
