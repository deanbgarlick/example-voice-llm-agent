import { useState } from "react"
import { type Product } from "@/lib/tools"

export function useCart() {
  const [cartItems, setCartItems] = useState<Array<{ product: Product; quantity: number }>>([])

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.product._id === product._id)
      if (existingItem) {
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, { product, quantity }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product._id !== productId))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const getCartItemCount = () => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0)
  }

  return {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    getCartItemCount,
  }
}
