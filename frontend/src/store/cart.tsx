import { createContext, useContext, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';

import type { Product, ProductVariant } from '../lib/api';

export type CartItem = { product: Product; quantity: number; variantId?: number };

const CART_STORAGE_KEY = 'market_cart';

// 統一的 variant 查找邏輯：消除重複
function getVariant(product: Product, variantId?: number): ProductVariant | undefined {
  if (!variantId || !product.variants) return undefined;
  return product.variants.find((v) => v.id === variantId);
}

// 統一的價格計算邏輯
function getItemPrice(item: CartItem): number {
  const variant = getVariant(item.product, item.variantId);
  return Number(variant?.price || item.product.price);
}

// 從 localStorage 載入購物車狀態
function loadCartFromStorage(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // localStorage 不可用或資料損壞，回傳空陣列
  }
  return [];
}

// 儲存購物車狀態到 localStorage
function saveCartToStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage 不可用，靜默失敗
  }
}

type CartState = { items: CartItem[] };

type Action =
  | { type: 'add'; product: Product; quantity: number; variantId?: number }
  | { type: 'setQty'; productId: number; variantId?: number; quantity: number }
  | { type: 'remove'; productId: number; variantId?: number }
  | { type: 'clear' };

function reducer(state: CartState, action: Action): CartState {
  let newState: CartState;

  switch (action.type) {
    case 'add': {
      const q = Math.max(1, Math.floor(action.quantity));
      // 如果有 variantId，需要同時比對 product.id 和 variantId
      const existing = state.items.find(
        (x) => x.product.id === action.product.id && x.variantId === action.variantId,
      );
      if (existing) {
        newState = {
          items: state.items.map((x) =>
            x.product.id === action.product.id && x.variantId === action.variantId
              ? { ...x, quantity: x.quantity + q }
              : x,
          ),
        };
      } else {
        newState = { items: [...state.items, { product: action.product, quantity: q, variantId: action.variantId }] };
      }
      break;
    }
    case 'setQty': {
      const q = Math.max(1, Math.floor(action.quantity));
      newState = {
        items: state.items.map((x) =>
          x.product.id === action.productId && x.variantId === action.variantId ? { ...x, quantity: q } : x,
        ),
      };
      break;
    }
    case 'remove':
      newState = {
        items: state.items.filter(
          (x) => !(x.product.id === action.productId && x.variantId === action.variantId),
        ),
      };
      break;
    case 'clear':
      newState = { items: [] };
      break;
    default:
      return state;
  }

  // 每次狀態變更後儲存到 localStorage
  saveCartToStorage(newState.items);
  return newState;
}

type CartApi = {
  items: CartItem[];
  add: (p: Product, quantity?: number, variantId?: number) => void;
  setQty: (productId: number, quantity: number, variantId?: number) => void;
  remove: (productId: number, variantId?: number) => void;
  clear: () => void;
  totalQuantity: number;
  totalAmount: number;
};

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  // 初始化時從 localStorage 載入
  const [state, dispatch] = useReducer(reducer, { items: loadCartFromStorage() });

  const api = useMemo<CartApi>(() => {
    const totalQuantity = state.items.reduce((sum, it) => sum + it.quantity, 0);
    const totalAmount = state.items.reduce((sum, it) => sum + getItemPrice(it) * it.quantity, 0);
    return {
      items: state.items,
      add: (p, quantity = 1, variantId) => dispatch({ type: 'add', product: p, quantity, variantId }),
      setQty: (id, quantity, variantId) => dispatch({ type: 'setQty', productId: id, quantity, variantId }),
      remove: (id, variantId) => dispatch({ type: 'remove', productId: id, variantId }),
      clear: () => dispatch({ type: 'clear' }),
      totalQuantity,
      totalAmount,
    };
  }, [state.items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
