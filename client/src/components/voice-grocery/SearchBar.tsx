
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  onSearch: () => void
}

export function SearchBar({ searchQuery, onSearchQueryChange, onSearch }: SearchBarProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                onSearch()
              }
            }}
          />
          <Button onClick={onSearch}>Search</Button>
        </div>
      </CardContent>
    </Card>
  )
}
