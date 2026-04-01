const API_BASE = 'http://localhost:8080';

export interface MenuItem {
  id: string;
  cart_id: string;
  name: string;
  description: string;
  price: number;
}

export interface Cart {
  id: string;
  name: string;
  description: string;
  cuisine_type: string;
  operator_id: string;
  is_open: boolean;
  hours_text: string;
  location_x: number | null;
  location_y: number | null;
  district: string;
  landmark_desc: string;
  created_at: string;
  updated_at: string;
  avg_stars: number | null;
  rating_count: number;
  menu_items?: MenuItem[];
}

export interface Rating {
  id: string;
  cart_id: string;
  traveler_id: string;
  stars: number;
  review_text: string | null;
  created_at: string;
}

export interface RatingsResponse {
  avg_stars: number | null;
  count: number;
  ratings: Rating[];
  my_rating: Rating | null;
}

export interface CartInput {
  name: string;
  description: string;
  cuisine_type: string;
  operator_id: string;
  is_open: boolean;
  hours_text: string;
  location_x: number | null;
  location_y: number | null;
  district: string;
  landmark_desc: string;
}

export interface MenuItemInput {
  name: string;
  description: string;
  price: number;
}

export interface CartFilter {
  district?: string;
  cuisine?: string;
  open?: boolean;
}

export async function browseAllCarts(filter: CartFilter = {}): Promise<Cart[]> {
  const params = new URLSearchParams();
  if (filter.district) params.set('district', filter.district);
  if (filter.cuisine) params.set('cuisine', filter.cuisine);
  if (filter.open) params.set('open', 'true');
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/v1/carts/browse${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch carts');
  return res.json();
}

export async function listMyCarts(operatorId: string): Promise<Cart[]> {
  const res = await fetch(`${API_BASE}/v1/carts?operator_id=${encodeURIComponent(operatorId)}`);
  if (!res.ok) throw new Error('Failed to fetch carts');
  return res.json();
}

export async function getCart(id: string): Promise<Cart> {
  const res = await fetch(`${API_BASE}/v1/carts/${id}`);
  if (!res.ok) throw new Error('Cart not found');
  return res.json();
}

export async function createCart(input: CartInput): Promise<Cart> {
  const res = await fetch(`${API_BASE}/v1/carts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create cart' }));
    throw new Error(err.error ?? 'Failed to create cart');
  }
  return res.json();
}

export async function updateCart(id: string, input: CartInput): Promise<Cart> {
  const res = await fetch(`${API_BASE}/v1/carts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update cart' }));
    throw new Error(err.error ?? 'Failed to update cart');
  }
  return res.json();
}

export async function deleteCart(id: string, operatorId: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/v1/carts/${id}?operator_id=${encodeURIComponent(operatorId)}`,
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error('Failed to delete cart');
}

export async function createMenuItem(
  cartId: string,
  operatorId: string,
  input: MenuItemInput,
): Promise<MenuItem> {
  const res = await fetch(
    `${API_BASE}/v1/carts/${cartId}/menu-items?operator_id=${encodeURIComponent(operatorId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create menu item' }));
    throw new Error(err.error ?? 'Failed to create menu item');
  }
  return res.json();
}

export async function updateMenuItem(
  cartId: string,
  itemId: string,
  operatorId: string,
  input: MenuItemInput,
): Promise<MenuItem> {
  const res = await fetch(
    `${API_BASE}/v1/carts/${cartId}/menu-items/${itemId}?operator_id=${encodeURIComponent(operatorId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  );
  if (!res.ok) throw new Error('Failed to update menu item');
  return res.json();
}

export async function deleteMenuItem(
  cartId: string,
  itemId: string,
  operatorId: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/v1/carts/${cartId}/menu-items/${itemId}?operator_id=${encodeURIComponent(operatorId)}`,
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error('Failed to delete menu item');
}

export async function getCartRatings(cartId: string, travelerId?: string): Promise<RatingsResponse> {
  const params = new URLSearchParams();
  if (travelerId) params.set('traveler_id', travelerId);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/v1/carts/${cartId}/ratings${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch ratings');
  return res.json();
}

export async function upsertRating(
  cartId: string,
  travelerId: string,
  stars: number,
  reviewText: string,
): Promise<Rating> {
  const res = await fetch(`${API_BASE}/v1/carts/${cartId}/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ traveler_id: travelerId, stars, review_text: reviewText || null }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to save rating' }));
    throw new Error(err.error ?? 'Failed to save rating');
  }
  return res.json();
}
