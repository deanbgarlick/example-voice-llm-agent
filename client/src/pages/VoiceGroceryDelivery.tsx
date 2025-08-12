import { useState, useEffect, useCallback } from "react"
import config from "@/config"
import useWebRTCAudioSession from "@/hooks/use-webrtc-audio"
import { ecommerceTools, type Product } from "@/lib/tools"
import { WelcomePopup } from "@/components/welcome-popup"
import { Header } from "@/components/voice-grocery/Header"
import { SearchBar } from "@/components/voice-grocery/SearchBar"
import { ProductGrid } from "@/components/voice-grocery/ProductGrid"
import { CartSection } from "@/components/voice-grocery/CartSection"
import { ConversationSection } from "@/components/voice-grocery/ConversationSection"
import { AudioIndicator } from "@/components/voice-grocery/AudioIndicator"
import { useCart } from "@/hooks/use-cart"
import { useOrder } from "@/hooks/use-order"

interface SearchArgs {
  query?: string
  category?: string
}

interface AddToCartArgs {
  productId: string
  quantity?: number
}

interface CreateOrderArgs {
  address: string
}

export default function VoiceGroceryDelivery() {
  const [discussedProducts, setDiscussedProducts] = useState<Product[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [address, setAddress] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isWelcomePopupOpen, setIsWelcomePopupOpen] = useState(true)

  const { cartItems, addToCart, removeFromCart, clearCart, getCartItemCount } = useCart()
  const { order, pastOrders, isOrderPending, createOrder } = useOrder()

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim()) {
      const products = await ecommerceTools.searchProducts({ query: searchQuery })
      setDiscussedProducts(products)
    }
  }, [searchQuery])

  const {
    status,
    isSessionActive,
    audioIndicatorRef,
    handleStartStopClick,
    registerFunction,
    conversation,
    currentVolume,
  } = useWebRTCAudioSession("alloy", [
    {
      type: "function",
      name: "searchProducts",
      description: "Search for grocery products by name, description, or category",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query for product title, description, or category",
          },
          category: {
            type: "string",
            description: "Specific category to search within",
          },
        },
        required: [],
      },
    },
    {
      type: "function",
      name: "getProductDetails",
      description: "Get detailed information about a specific grocery product",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "The unique identifier of the product",
          },
        },
        required: ["productId"],
      },
    },
    {
      type: "function",
      name: "addToCart",
      description: "Add a grocery product to the shopping cart",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "The unique identifier of the product to add to cart",
          },
          quantity: {
            type: "integer",
            description: "The quantity of the product to add",
            default: 1,
            minimum: 1,
          },
        },
        required: ["productId"],
      },
    },
    {
      type: "function",
      name: "createOrder",
      description: "Create a new grocery delivery order from the shopping cart",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "Delivery address for the order",
          },
        },
        required: ["address"],
      },
    },
  ])

  const handleStartStop = useCallback(async () => {
    if (!isSessionActive) {
      setIsConnecting(true)
      try {
        await handleStartStopClick()
      } finally {
        setIsConnecting(false)
      }
    } else {
      handleStartStopClick()
    }
  }, [isSessionActive, handleStartStopClick])

  // Register e-commerce functions
  useEffect(() => {
    registerFunction("searchProducts", async (args: SearchArgs) => {
      const products = await ecommerceTools.searchProducts(args)
      setDiscussedProducts(Array.isArray(products) ? products : [products])
      return products
    })
    registerFunction("getProductDetails", ecommerceTools.getProductDetails)
    registerFunction("addToCart", async (args: AddToCartArgs) => {
      const result = await ecommerceTools.addToCart({ ...args, quantity: args.quantity || 1 })
      addToCart(result.product, args.quantity || 1)
      return result
    })
    registerFunction("createOrder", async (args: CreateOrderArgs) => {
      const result = await createOrder(cartItems, args.address)
      if (result) {
        clearCart()
      }
      return result
    })
  }, [registerFunction, cartItems, addToCart, clearCart, createOrder])

  // Fetch random products on initial load
  useEffect(() => {
    const fetchRandomProducts = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/products?random=true`)
        if (!response.ok) {
          throw new Error("Failed to fetch random products")
        }
        const randomProducts = await response.json()
        setDiscussedProducts(randomProducts)
      } catch (error) {
        console.error("Error fetching random products:", error)
      }
    }

    fetchRandomProducts()
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <WelcomePopup isOpen={isWelcomePopupOpen} onClose={() => setIsWelcomePopupOpen(false)} />
      <div className="max-w-6xl mx-auto space-y-4">
        <Header
          isSessionActive={isSessionActive}
          isConnecting={isConnecting}
          cartItemCount={getCartItemCount()}
          pastOrders={pastOrders}
          onStartStop={handleStartStop}
        />

        {status && <div className="text-sm text-muted-foreground mb-4">Status: {status}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <SearchBar
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSearch={handleSearch}
            />
            <ProductGrid
              products={discussedProducts}
              searchQuery={searchQuery}
              onAddToCart={(productId, quantity) =>
                ecommerceTools.addToCart({ productId, quantity })
              }
            />
          </div>

          <div className="space-y-4">
            <ConversationSection conversation={conversation} />
            <CartSection
              cartItems={cartItems}
              address={address}
              isOrderPending={isOrderPending}
              order={order}
              onAddressChange={setAddress}
              onRemoveItem={removeFromCart}
              onCreateOrder={() => createOrder(cartItems, address)}
            />
          </div>
        </div>

        <AudioIndicator
          isSessionActive={isSessionActive}
          currentVolume={currentVolume}
          audioIndicatorRef={audioIndicatorRef as React.RefObject<HTMLDivElement>}
        />
      </div>
    </div>
  )
}