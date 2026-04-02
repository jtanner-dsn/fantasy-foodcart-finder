'use client';

import { useRouter } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import CartForm from '@/components/CartForm';
import { createCart, type CartInput } from '@/lib/api';

export default function NewCartPage() {
  const router = useRouter();
  const { sessionToken } = useRole();

  const handleSubmit = async (input: CartInput) => {
    await createCart(input);
    router.push('/merchant');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="page-title mb-2">Register a New Cart</h1>
      <p className="text-stone-400 mb-8">
        Add your stall to the Misthaven guild ledger.
      </p>
      <CartForm
        operatorId={sessionToken}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/merchant')}
        submitLabel="Register Cart"
      />
    </div>
  );
}
