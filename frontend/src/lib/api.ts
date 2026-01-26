export type Tag = { id: number; name: string };

export type ProductVariant = {
  id: number;
  name: string;
  price: string;
  image_url: string;
  is_active: boolean;
  order: number;
};

export type Product = {
  id: number;
  name: string;
  price: string;
  is_active: boolean;
  has_variants: boolean;
  image_url: string;
  description: string;
  tags: Tag[];
  variants?: ProductVariant[];
};

export type OrderItem = {
  id: number;
  product: number | null;
  product_name_snapshot: string;
  unit_price_snapshot: string;
  quantity: number;
  line_total: string;
};

export type Order = {
  id: number;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  pickup_store_address: string;
  total_amount: string;
  status: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  transfer?: {
    bank_name_code: string;
    bank_account: string;
    amount: string;
  };
  line?: {
    oa_id: string;
    chat_url: string;
    add_friend_url: string;
  };
};

// 取得 CSRF Token（資安：防止 CSRF 攻擊）
async function getCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/csrf-token/`, { method: 'GET', credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      return data.csrfToken || null;
    }
  } catch {
    // 如果後端沒有提供 CSRF Token endpoint，返回 null
  }
  return null;
}

// API 基礎 URL（生產環境從環境變數讀取，開發環境使用相對路徑）
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  // 生產環境使用完整 URL，開發環境使用相對路徑（透過 Vite proxy）
  const baseUrl = API_BASE_URL || '';
  const url = path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
  
  // 資安：對於需要認證的請求，取得 CSRF Token
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init?.headers as Record<string, string> ?? {}) };
  
// 如果是 POST/PUT/PATCH/DELETE，需要 CSRF Token
const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(init?.method || '');
if (needsCsrf) {
  const csrfToken = await getCsrfToken();
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }
}
  
  const res = await fetch(url, {
    headers,
    credentials: 'include', // 資安：允許傳送 Cookie（Session）
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  // DELETE might return 204 No Content (empty body)
  if (init?.method === 'DELETE' && (res.status === 204 || res.status === 200)) {
    // Try to parse JSON, but allow empty response
    const text = await res.text();
    if (!text) {
      return undefined as T;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      return undefined as T;
    }
  }
  return (await res.json()) as T;
}

export async function listTags(): Promise<Tag[]> {
  return http<Tag[]>('/api/tags/');
}

// 統一的查詢參數構建邏輯
function buildQueryString(params: Record<string, string | string[] | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value) && value.length > 0) {
        qs.set(key, value.join(','));
      } else if (typeof value === 'string' && value) {
        qs.set(key, value);
      }
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export async function listProducts(params?: { tags?: string[]; search?: string }): Promise<Product[]> {
  return http<Product[]>(`/api/products/${buildQueryString(params || {})}`);
}

export async function getProductDetail(id: string): Promise<Product> {
  return http<Product>(`/api/products/${id}/`);
}

export async function createOrder(input: {
  customer_name: string;
  customer_phone: string;
  pickup_store_address: string;
  items: { product_id: number; quantity: number; variant_id?: number }[];
}): Promise<Order> {
  return http<Order>('/api/orders/create/', { method: 'POST', body: JSON.stringify(input) });
}


