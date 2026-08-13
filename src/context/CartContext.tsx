import React, { createContext, useContext, useState } from 'react';

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
  addToCart: (dish: any, restId?: string, restName?: string) => void;
  removeFromCart: (dishId: string) => void;
  clearCart: () => void;
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
  getCartList: () => [],
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<Record<string, CartItem>>({});
  const [restaurantId, setRestaurantId] = useState<string>('6a71cf90ab29fa88687723b4');
  const [restaurantName, setRestaurantName] = useState<string>('Jassi De Parathe');

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
          price: dish.price || 149,
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
        getCartList,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
