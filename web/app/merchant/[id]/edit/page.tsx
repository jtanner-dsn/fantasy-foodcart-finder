'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import CartForm from '@/components/CartForm';
import { getCart, updateCart, type Cart, type CartInput } from '@/lib/api';

export default function EditCartPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { sessionToken } = useRole();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getCart(id)
      .then((c) => {
        setCart(c);
        setLoading(false);
      })
      .catch(() => {
        setError('Cart not found.');
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (input: CartInput) => {
    await updateCart(id, input);
    router.push('/merchant');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-32" />
        </div>
      </div>
    );
  }

  if (error || !cart) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="card px-6 py-8 text-center space-y-3">
          <p className="text-red-400">{error || 'Cart not found.'}</p>
        </div>
      </div>
    );
  }

  // Guard: only the owning merchant can edit
  if (cart.operator_id !== sessionToken) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="card px-6 py-8 text-center">
          <p className="text-red-400">This cart belongs to a different merchant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="page-title mb-2">Edit Cart</h1>
      <p className="text-stone-400 mb-8">{cart.name}</p>
      <CartForm
        initial={cart}
        operatorId={sessionToken}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/merchant')}
        submitLabel="Save Changes"
      />
    </div>
  );
}
