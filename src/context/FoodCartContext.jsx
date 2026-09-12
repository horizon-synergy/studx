import { createContext, useContext, useState, useCallback } from 'react'
const FoodCartContext = createContext(null)

export function FoodCartProvider({ children }) {
  const [items, setItems] = useState([]) // { id, name, price, vendorId, vendorName, quantity, imageUrl }

  const addItem = useCallback((item, qty = 1) => {
    setItems((prev) => {
      // One vendor per cart
      if (prev.length && prev[0].vendorId !== item.vendorId) {
        if (!confirm('Your cart has items from another vendor. Clear it and add this item?')) return prev
        return [{ ...item, quantity: qty }]
      }
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + qty } : i)
      }
      return [...prev, { ...item, quantity: qty }]
    })
  }, [])

  const setQty = useCallback((id, quantity) => {
    setItems((prev) => prev
      .map((i) => i.id === id ? { ...i, quantity } : i)
      .filter((i) => i.quantity > 0))
  }, [])

  const removeItem = useCallback((id) => setItems((prev) => prev.filter((i) => i.id !== id)), [])
  const clear = useCallback(() => setItems([]), [])
  const total = items.reduce((sum, i) => sum + Number(i.price || 0) * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <FoodCartContext.Provider value={{ items, addItem, setQty, removeItem, clear, total, count }}>
      {children}
    </FoodCartContext.Provider>
  )
}

export function useFoodCart() {
  const ctx = useContext(FoodCartContext)
  if (!ctx) throw new Error('useFoodCart must be used within <FoodCartProvider>')
  return ctx
}
