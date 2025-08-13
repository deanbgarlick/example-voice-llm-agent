
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Product, type Order } from "@/lib/tools"

interface CartSectionProps {
  cartItems: Array<{ product: Product; quantity: number }>
  address: string
  isOrderPending: boolean
  order: Order | null
  onAddressChange: (address: string) => void
  onRemoveItem: (productId: string) => void
  onCreateOrder: () => void
}

export function CartSection({
  cartItems,
  address,
  isOrderPending,
  order,
  onAddressChange,
  onRemoveItem,
  onCreateOrder,
}: CartSectionProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">Shopping Cart</h2>
          <div className="h-[200px] overflow-y-auto">
            {cartItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{item.product.emoji}</span>
                  <div>
                    <h3 className="font-medium">{item.product.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x {item.product.price}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveItem(item.product._id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Delivery Address</Label>
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <Input
                id="address"
                placeholder="Enter your delivery address"
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
              />
            </div>
          </div>
          {cartItems.length > 0 && (
            <Button
              onClick={onCreateOrder}
              disabled={isOrderPending || !address}
              className="w-full"
            >
              {isOrderPending ? "Creating Order..." : "Place Order"}
            </Button>
          )}
        </CardContent>
      </Card>

      {order && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">Order Created</h2>
            <p>Order ID: {order.id}</p>
            <p>Status: {order.status}</p>
            <p>Created at: {order.createdAt.toLocaleString()}</p>
            <p>Delivery Address: {order.address}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
