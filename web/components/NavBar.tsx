'use client';

import Link from 'next/link';
import RoleSelector from '@/components/RoleSelector';
import { useRole } from '@/context/RoleContext';

export default function NavBar() {
  const { role } = useRole();

  return (
    <nav className="border-b border-stone-700 bg-stone-900 px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href={role === 'merchant' ? '/merchant' : '/traveler'} className="shrink-0">
            <span className="font-display text-base font-bold tracking-wide text-amber-400 sm:text-lg">
              <span className="hidden sm:inline">Adventurer&rsquo;s Food-Cart Finder</span>
              <span className="sm:hidden">Misthaven</span>
            </span>
          </Link>
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
      </div>
    </nav>
  );
}
