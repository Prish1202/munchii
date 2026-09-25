import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
  preparationTimeMinutes: number;
  restaurantBufferMinutes: number;
  optionLabel?: string | null;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  longestPreparationMinutes: number;
  restaurantBufferMinutes: number;
  selectedPickupTime: string | null;
  setSelectedPickupTime: (value: string | null) => void;
}

export const lineKeyOf = (i: { menuItemId: string; optionLabel?: string | null }) => i.optionLabel ? `${i.menuItemId}::${i.optionLabel}` : i.menuItemId;

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'foodmarket_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [restaurantBufferMinutes, setRestaurantBufferMinutes] = useState(5);
  const [selectedPickupTime, setSelectedPickupTime] = useState<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems((parsed.items || []).map((item: CartItem) => ({
          ...item,
          preparationTimeMinutes: item.preparationTimeMinutes ?? 10,
        })));
        setRestaurantId(parsed.restaurantId || null);
        setRestaurantName(parsed.restaurantName || null);
        setRestaurantBufferMinutes(parsed.restaurantBufferMinutes ?? 5);
        setSelectedPickupTime(parsed.selectedPickupTime || null);
      } catch {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
      items,
      restaurantId,
      restaurantName,
      restaurantBufferMinutes,
      selectedPickupTime,
    }));
  }, [items, restaurantId, restaurantName, restaurantBufferMinutes, selectedPickupTime]);

  const addItem = (item: Omit<CartItem, 'id' | 'quantity'>) => {
    // If adding from a different restaurant, clear the cart first
    if (restaurantId && restaurantId !== item.restaurantId) {
      setItems([{
        ...item,
        id: crypto.randomUUID(),
        quantity: 1,
      }]);
      setRestaurantId(item.restaurantId);
      setRestaurantName(item.restaurantName);
      setRestaurantBufferMinutes(item.restaurantBufferMinutes ?? 5);
      setSelectedPickupTime(null);
      return;
    }

    setItems(prev => {
      const key = lineKeyOf(item);
      const existing = prev.find(i => lineKeyOf(i) === key);
      if (existing) {
        return prev.map(i => 
          lineKeyOf(i) === key 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, id: crypto.randomUUID(), quantity: 1 }];
    });

    if (!restaurantId) {
      setRestaurantId(item.restaurantId);
      setRestaurantName(item.restaurantName);
      setRestaurantBufferMinutes(item.restaurantBufferMinutes ?? 5);
    }
    setSelectedPickupTime(null);
  };

  const removeItem = (menuItemId: string) => {
    setItems(prev => {
      const updated = prev.filter(i => lineKeyOf(i) !== menuItemId);
      if (updated.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
        setRestaurantBufferMinutes(5);
        setSelectedPickupTime(null);
      }
      return updated;
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems(prev => 
      prev.map(i => 
        lineKeyOf(i) === menuItemId ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
    setRestaurantBufferMinutes(5);
    setSelectedPickupTime(null);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const longestPreparationMinutes = items.reduce(
    (longest, item) => Math.max(longest, item.preparationTimeMinutes ?? 10),
    0,
  );

  return (
    <CartContext.Provider value={{
      items,
      restaurantId,
      restaurantName,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalAmount,
      longestPreparationMinutes,
      restaurantBufferMinutes,
      selectedPickupTime,
      setSelectedPickupTime,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
