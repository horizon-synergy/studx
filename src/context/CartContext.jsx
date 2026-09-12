import { createContext, useContext, useState, useCallback } from 'react'
const CartContext = createContext(null)
export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const addToCart = useCallback((listing) => setItems((prev) => prev.some((i) => i.id === listing.id) ? prev : [...prev, listing]), [])
  const removeFromCart = useCallback((id) => setItems((prev) => prev.filter((i) => i.id !== id)), [])
  const clearCart = useCallback(() => setItems([]), [])
  const isInCart = useCallback((id) => items.some((i) => i.id === id), [items])
  const total = items.reduce((sum, i) => sum + Number(i.price || 0), 0)
  return <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, isInCart, total, count: items.length }}>{children}</CartContext.Provider>
}
export function useCart() { const ctx = useContext(CartContext); if (!ctx) throw new Error('useCart must be used within <CartProvider>'); return ctx }
