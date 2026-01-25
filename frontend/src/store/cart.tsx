import React, { createContext, useContext, useMemo, useReducer } from 'react';

import type { Product, ProductVariant } from '../lib/api';

export type CartItem = { product: Product; quantity: number; variantId?: number };

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

type CartState = { items: CartItem[] };

type Action =
  | { type: 'add'; product: Product; quantity: number; variantId?: number }
  | { type: 'setQty'; productId: number; variantId?: number; quantity: number }
  | { type: 'remove'; productId: number; variantId?: number }
  | { type: 'clear' };

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'add': {
      const q = Math.max(1, Math.floor(action.quantity));
      // 如果有 variantId，需要同時比對 product.id 和 variantId
      const existing = state.items.find(
        (x) => x.product.id === action.product.id && x.variantId === action.variantId,
      );
      if (existing) {
        return {
          items: state.items.map((x) =>
            x.product.id === action.product.id && x.variantId === action.variantId
              ? { ...x, quantity: x.quantity + q }
              : x,
          ),
        };
      }
      return { items: [...state.items, { product: action.product, quantity: q, variantId: action.variantId }] };
    }
    case 'setQty': {
      const q = Math.max(1, Math.floor(action.quantity));
      return {
        items: state.items.map((x) =>
          x.product.id === action.productId && x.variantId === action.variantId ? { ...x, quantity: q } : x,
        ),
      };
    }
    case 'remove':
      return {
        items: state.items.filter(
          (x) => !(x.product.id === action.productId && x.variantId === action.variantId),
        ),
      };
    case 'clear':
      return { items: [] };
    default:
      return state;
  }
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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });
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


