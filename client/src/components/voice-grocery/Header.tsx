import React from "react"
import { Mic, MicOff, ShoppingCart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { type Order } from "@/lib/tools"

interface HeaderProps {
  isSessionActive: boolean
  isConnecting: boolean
  cartItemCount: number
  pastOrders: Order[]
  onStartStop: () => void
}

export function Header({
  isSessionActive,
  isConnecting,
  cartItemCount,
  pastOrders,
  onStartStop,
}: HeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-10 rounded-full p-0">
              <User className="h-4 w-4" />
              <span className="sr-only">Open profile</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Past Orders</h4>
                <p className="text-sm text-muted-foreground">Orders from the current session</p>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {pastOrders.map((pastOrder, index) => (
                  <div key={index} className="border-b pb-2 mb-2 last:border-b-0">
                    <p className="font-medium">Order #{index + 1}</p>
                    <p className="text-sm">Status: {pastOrder.status}</p>
                    <p className="text-sm">
                      Items: {pastOrder.items.reduce((acc, item) => acc + item.quantity, 0)}
                    </p>
                    <p className="text-sm">Address: {pastOrder.address}</p>
                  </div>
                ))}
                {pastOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground">No past orders in this session</p>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <h1 className="text-3xl font-bold">Voice Grocery Assistant</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          <span className="font-medium">{cartItemCount} items</span>
        </div>
        <Button
          onClick={onStartStop}
          variant={isSessionActive ? "destructive" : "default"}
          disabled={isConnecting}
        >
          {isSessionActive ? (
            <>
              <MicOff className="w-4 h-4 mr-2" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              <span>{isConnecting ? "Connecting..." : "Start Voice Assistant"}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
