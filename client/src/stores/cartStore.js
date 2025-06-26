import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      // State
      items: [],
      masaNo: null,

      // Actions
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(i => i.id === item.id);
          
          if (existingItem) {
            return {
              items: state.items.map(i =>
                i.id === item.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              )
            };
          } else {
            return {
              items: [...state.items, { ...item, quantity: 1 }]
            };
          }
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== itemId)
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map(item =>
            item.id === itemId
              ? { ...item, quantity }
              : item
          )
        }));
      },

      clearCart: () => {
        set({ items: [], masaNo: null });
      },

      setMasaNo: (masaNo) => {
        set({ masaNo });
      },

      getTotalPrice: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.fiyat * item.quantity), 0);
      },

      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getItemsForOrder: () => {
        const { items } = get();
        return items.map(item => ({
          menu_id: item.id,
          adet: item.quantity,
          notlar: item.notlar || ''
        }));
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        masaNo: state.masaNo,
      }),
    }
  )
);

export default useCartStore; 