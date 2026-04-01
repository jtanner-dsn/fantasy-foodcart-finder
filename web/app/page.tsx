'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRole } from '@/lib/session';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const role = getRole();
    router.replace(`/${role}`);
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-stone-400 animate-pulse">Consulting the guild records…</p>
    </div>
  );
}
