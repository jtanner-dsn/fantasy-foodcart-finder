'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Cart, CartInput, MenuItem, MenuItemInput } from '@/lib/api';
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '@/lib/api';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

const CUISINE_TYPES = [
  'Alchemist Brews',
  'Baked Goods',
  'BBQ & Grilled Meats',
  'Dumplings & Wraps',
  'Frozen Treats',
  'Noodles & Soups',
  'Pizza & Flatbreads',
  'Potions & Tonics',
  'Seafood',
  'Stew & Hearty Fare',
  'Street Skewers',
  'Sweet Confections',
];

const DISTRICTS = [
  'Midheath',
  'Peridozys',
  'Beerside',
  'Westheath',
  'Aspenlane',
  'Oakcorner',
];

interface CartFormProps {
  initial?: Cart;
  operatorId: string;
  onSubmit: (input: CartInput) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}

export default function CartForm({
  initial,
  operatorId,
  onSubmit,
  onCancel,
  submitLabel,
}: CartFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [cuisineType, setCuisineType] = useState(initial?.cuisine_type ?? '');
  const [isOpen, setIsOpen] = useState(initial?.is_open ?? false);
  const [hoursText, setHoursText] = useState(initial?.hours_text ?? '');
  const [location, setLocation] = useState<{ x: number | null; y: number | null }>({
    x: initial?.location_x ?? null,
    y: initial?.location_y ?? null,
  });
  const [district, setDistrict] = useState(initial?.district ?? '');
  const [landmarkDesc, setLandmarkDesc] = useState(initial?.landmark_desc ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Menu items state (only used in edit mode — cart must exist)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initial?.menu_items ?? []);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [menuError, setMenuError] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Cart name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        cuisine_type: cuisineType,
        operator_id: operatorId,
        is_open: isOpen,
        hours_text: hoursText.trim(),
        location_x: location.x,
        location_y: location.y,
        district,
        landmark_desc: landmarkDesc.trim(),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMenuItem = async () => {
    if (!initial?.id) return;
    if (!newItemName.trim()) {
      setMenuError('Item name is required.');
      return;
    }
    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price < 0) {
      setMenuError('Enter a valid price.');
      return;
    }
    setAddingItem(true);
    setMenuError('');
    try {
      const item = await createMenuItem(initial.id, operatorId, {
        name: newItemName.trim(),
        description: newItemDescription.trim(),
        price,
      });
      setMenuItems((prev) => [...prev, item]);
      setNewItemName('');
      setNewItemDescription('');
      setNewItemPrice('');
    } catch (err: unknown) {
      setMenuError(err instanceof Error ? err.message : 'Failed to add item.');
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!initial?.id) return;
    try {
      await deleteMenuItem(initial.id, itemId, operatorId);
      setMenuItems((prev) => prev.filter((m) => m.id !== itemId));
    } catch {
      setMenuError('Failed to remove item.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Core details ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
          Cart Details
        </h2>

        <div>
          <label className="block text-sm text-stone-300 mb-1">
            Cart / Stall Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dragon-Fired Pizza Lair"
            className="w-full rounded-lg bg-stone-800 border border-stone-600 px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-sm text-stone-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What makes your stall special?"
            className="w-full rounded-lg bg-stone-800 border border-stone-600 px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-stone-300 mb-1">Cuisine Type</label>
          <select
            value={cuisineType}
            onChange={(e) => setCuisineType(e.target.value)}
            className="w-full rounded-lg bg-stone-800 border border-stone-600 px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-400"
          >
            <option value="">— Select a type —</option>
            {CUISINE_TYPES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </section>

      {/* ── Hours & status ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
          Hours & Status
        </h2>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isOpen}
            onClick={() => setIsOpen((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isOpen ? 'bg-amber-400' : 'bg-stone-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isOpen ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-stone-300 text-sm">
            {isOpen ? 'Open for business' : 'Closed'}
          </span>
        </div>

        <div>
          <label className="block text-sm text-stone-300 mb-1">Trading Hours</label>
          <input
            type="text"
            value={hoursText}
            onChange={(e) => setHoursText(e.target.value)}
            placeholder="e.g. Dawn to Dusk, Mon–Fri"
            className="w-full rounded-lg bg-stone-800 border border-stone-600 px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </section>

      {/* ── Location ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
          Location in Misthaven
        </h2>

        <div>
          <label className="block text-sm text-stone-300 mb-1">District</label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full rounded-lg bg-stone-800 border border-stone-600 px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-400"
          >
            <option value="">— Select a district —</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-stone-300 mb-1">Landmark Description</label>
          <input
            type="text"
            value={landmarkDesc}
            onChange={(e) => setLandmarkDesc(e.target.value)}
            placeholder="e.g. Near the old clock tower"
            className="w-full rounded-lg bg-stone-800 border border-stone-600 px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-sm text-stone-300 mb-2">Pin on Map</label>
          <MapPicker value={location} onChange={(coords) => setLocation(coords)} />
          {(location.x !== null || location.y !== null) && (
            <button
              type="button"
              onClick={() => setLocation({ x: null, y: null })}
              className="mt-1 text-xs text-stone-500 hover:text-red-400 underline"
            >
              Remove pin
            </button>
          )}
        </div>
      </section>

      {/* ── Menu items (edit mode only) ── */}
      {initial?.id && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
            Menu Items
          </h2>

          {menuItems.length > 0 && (
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-stone-800 border border-stone-700 px-4 py-2"
                >
                  <div>
                    <p className="text-stone-100 text-sm font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-stone-500 text-xs">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 text-sm">{item.price.toFixed(2)} gp</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteMenuItem(item.id)}
                      className="text-stone-500 hover:text-red-400 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Add new item row */}
          <div className="rounded-lg border border-dashed border-stone-600 p-4 space-y-3">
            <p className="text-xs text-stone-400">Add a menu item</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Item name"
                className="flex-1 rounded-lg bg-stone-800 border border-stone-600 px-3 py-2 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-400"
              />
              <input
                type="number"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                placeholder="Price (gp)"
                min="0"
                step="0.01"
                className="w-28 rounded-lg bg-stone-800 border border-stone-600 px-3 py-2 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <input
              type="text"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder="Item description (optional)"
              className="w-full rounded-lg bg-stone-800 border border-stone-600 px-3 py-2 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-400"
            />
            {menuError && <p className="text-red-400 text-xs">{menuError}</p>}
            <button
              type="button"
              onClick={handleAddMenuItem}
              disabled={addingItem}
              className="rounded-lg bg-stone-700 hover:bg-stone-600 px-4 py-2 text-sm text-stone-100 disabled:opacity-50"
            >
              {addingItem ? 'Adding…' : '+ Add Item'}
            </button>
          </div>
        </section>
      )}

      {/* ── Actions ── */}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber-400 hover:bg-amber-300 px-6 py-2 font-semibold text-stone-900 disabled:opacity-50"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-stone-600 hover:border-stone-400 px-6 py-2 text-stone-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
