export default function MerchantPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-amber-400">Merchant&rsquo;s Guild</h1>
      <p className="mt-2 text-stone-400">Manage your cart or stall</p>

      <div className="mt-10 flex items-center justify-center rounded-xl border border-dashed border-stone-600 bg-stone-800 py-24">
        <span className="text-stone-500 text-lg">Your listings will appear here</span>
      </div>
    </div>
  );
}
