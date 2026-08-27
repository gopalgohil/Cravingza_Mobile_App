import React, { createContext, useContext, useState } from 'react';
import { addToCartApi } from '../features/customer/services/customerApi';

export interface CartItem {
  id: string;
  menuItem?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartContextType {
  cartItems: Record<string, CartItem>;
  cartCount: number;
  totalPrice: number;
  restaurantId: string;
  restaurantName: string;
  addToCart: (dish: any, restId?: string, restName?: string, exactQty?: number) => void;
  removeFromCart: (dishId: string) => void;
  clearCart: () => void;
  replaceCartWithItems: (items: any[], restId?: string, restName?: string) => void;
  getCartList: () => CartItem[];
}

const CartContext = createContext<CartContextType>({
  cartItems: {},
  cartCount: 0,
  totalPrice: 0,
  restaurantId: '',
  restaurantName: '',
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  replaceCartWithItems: () => {},
  getCartList: () => [],
});

let globalClearCartFn: (() => void) | null = null;

export const clearCartOnLogout = () => {
  if (globalClearCartFn) {
    globalClearCartFn();
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<Record<string, CartItem>>({});
  const [restaurantId, setRestaurantId] = useState<string>('6a71cf90ab29fa88687723b4');
  const [restaurantName, setRestaurantName] = useState<string>('Jassi De Parathe');

  React.useEffect(() => {
    globalClearCartFn = () => {
      setCartItems({});
    };
    return () => {
      globalClearCartFn = null;
    };
  }, []);

  const addToCart = (dish: any, restId?: string, restName?: string) => {
    if (restId) setRestaurantId(restId);
    if (restName) setRestaurantName(restName);

    const dishId = dish.id || dish._id || dish.menuItem;
    if (!dishId) return;

    setCartItems((prev) => {
      const existing = prev[dishId];
      const newQty = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [dishId]: {
          id: dishId,
          menuItem: dishId,
          name: dish.name || 'Delicious Item',
          price: Number(dish.price || 149),
          quantity: newQty,
          image:
            dish.image ||
            dish.imageUrl ||
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=60',
        },
      };
    });
  };

  const removeFromCart = (dishId: string) => {
    setCartItems((prev) => {
      const existing = prev[dishId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[dishId];
        return copy;
      }
      return {
        ...prev,
        [dishId]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      };
    });
  };

  const clearCart = () => {
    setCartItems({});
  };

  const replaceCartWithItems = (newItems: any[], restId?: string, restName?: string) => {
    if (restId) setRestaurantId(restId);
    if (restName) setRestaurantName(restName);

    if (!Array.isArray(newItems) || newItems.length === 0) {
      setCartItems({});
      return;
    }

    const newMap: Record<string, CartItem> = {};
    newItems.forEach((it: any, idx: number) => {
      const dishId = String(it.menuItem || it.id || it._id || `reorder_${idx}`);
      newMap[dishId] = {
        id: dishId,
        menuItem: dishId,
        name: it.name || 'Delicious Item',
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        image:
          it.image ||
          it.imageUrl ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=60',
      };
    });
    setCartItems(newMap);
  };

  const getCartList = (): CartItem[] => {
    return Object.values(cartItems);
  };

  const cartCount = Object.values(cartItems).reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = Object.values(cartItems).reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        totalPrice,
        restaurantId,
        restaurantName,
        addToCart,
        removeFromCart,
        clearCart,
        replaceCartWithItems,
        getCartList,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
