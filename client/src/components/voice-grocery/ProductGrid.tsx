
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Product } from "@/lib/tools"

interface ProductGridProps {
  products: Product[]
  searchQuery?: string
  onAddToCart: (productId: string, quantity: number) => void
}

export function ProductGrid({ products, searchQuery, onAddToCart }: ProductGridProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h2 className="text-xl font-semibold">
          {searchQuery ? `Search Results for "${searchQuery}"` : "Featured Products"}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="border rounded-xl p-4 flex flex-col items-center text-center hover:border-primary transition-colors"
            >
              <span className="text-4xl mb-2">{product.emoji}</span>
              <h3 className="font-medium">{product.title}</h3>
              <p className="text-sm text-muted-foreground">{product.price}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => onAddToCart(product._id, 1)}
              >
                Add to Cart
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
