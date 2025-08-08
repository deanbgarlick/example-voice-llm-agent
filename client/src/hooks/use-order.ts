import { useState } from "react"
import { type Order } from "@/lib/tools"
import { ecommerceTools } from "@/lib/tools"

export function useOrder() {
  const [order, setOrder] = useState<Order | null>(null)
  const [pastOrders, setPastOrders] = useState<Order[]>([])
  const [isOrderPending, setIsOrderPending] = useState(false)

  const createOrder = async (cartItems: Array<{ product: any; quantity: number }>, address: string) => {
    if (cartItems.length === 0 || !address) return null

    setIsOrderPending(true)
    try {
      const newOrder = await ecommerceTools.createOrder(cartItems, address)
      setOrder(newOrder)
      setPastOrders((prevOrders) => [...prevOrders, newOrder])
      return newOrder
    } catch (error) {
      console.error("Failed to create order:", error)
      return null
    } finally {
      setIsOrderPending(false)
    }
  }

  return {
    order,
    pastOrders,
    isOrderPending,
    createOrder,
  }
}
