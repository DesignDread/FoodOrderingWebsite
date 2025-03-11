"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Heart, ShoppingCart, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const HomePage = () => {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    minPrice: 0,
    maxPrice: 100,
  })
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetchFoods()
  }, [])

  const fetchFoods = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/food")
      setFoods(response.data)

      // Extract unique categories
      const allCategories = response.data.flatMap((food) => food.category)
      const uniqueCategories = [...new Set(allCategories)]
      setCategories(uniqueCategories)

      setLoading(false)
    } catch (error) {
      console.error("Error fetching foods:", error)
      toast.error("Failed to load food items")
      setLoading(false)
    }
  }

  const handleAddToCart = async (foodId) => {
    const token = localStorage.getItem("token")

    if (!token) {
      toast.error("Please login to add items to cart")
      navigate("/login")
      return
    }

    try {
      await axios.post(
        "http://localhost:8080/api/user/cart",
        { productId: foodId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success("Added to cart!")
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Failed to add to cart")
    }
  }

  const handleAddToFavorites = async (foodId) => {
    const token = localStorage.getItem("token")

    if (!token) {
      toast.error("Please login to add items to favorites")
      navigate("/login")
      return
    }

    try {
      await axios.post(
        "http://localhost:8080/api/user/favorite",
        { productId: foodId },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success("Added to favorites!")
    } catch (error) {
      console.error("Error adding to favorites:", error)
      toast.error("Failed to add to favorites")
    }
  }

  const applyFilters = () => {
    let url = "http://localhost:8080/api/food?"

    if (filters.search) {
      url += `search=${filters.search}&`
    }

    if (filters.category) {
      url += `categories=${filters.category}&`
    }

    if (filters.minPrice > 0) {
      url += `minPrice=${filters.minPrice}&`
    }

    if (filters.maxPrice < 100) {
      url += `maxPrice=${filters.maxPrice}&`
    }

    setLoading(true)
    axios
      .get(url)
      .then((response) => {
        setFoods(response.data)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error applying filters:", error)
        toast.error("Failed to filter food items")
        setLoading(false)
      })
  }

  const handleViewDetails = (foodId) => {
    navigate(`/food/${foodId}`)
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Food Delivery</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/cart")}>
            <ShoppingCart className="h-5 w-5 mr-2" />
            Cart
          </Button>
          <Button variant="outline" onClick={() => navigate("/favourite")}>
            <Heart className="h-5 w-5 mr-2" />
            Favorites
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          {/* <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search foods..."
              className="pl-8"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div> */}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Filters</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Options</SheetTitle>
              <SheetDescription>Narrow down your food choices</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Category</h3>
                <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category, index) => (
                      <SelectItem key={index} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Price Range</h3>
                <div className="pt-4">
                  <Slider
                    defaultValue={[filters.minPrice, filters.maxPrice]}
                    max={100}
                    step={1}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        minPrice: value[0],
                        maxPrice: value[1],
                      })
                    }
                  />
                  <div className="flex justify-between mt-2">
                    <span>${filters.minPrice}</span>
                    <span>${filters.maxPrice}</span>
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading food items...</p>
        </div>
      ) : foods.length === 0 ? (
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold">No food items found</h2>
          <p className="text-muted-foreground">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {foods.map((food) => (
            <Card key={food.id} className="overflow-hidden">
              <CardHeader className="p-0">
                <img
                  src={food.img || "/placeholder.svg?height=200&width=400"}
                  alt={food.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=200&width=400"
                  }}
                />
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl mb-2">{food.name}</CardTitle>
                  <div className="flex items-center">
                    <span className="font-bold text-lg">${food.price.org}</span>
                    {food.price.off > 0 && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {food.price.off}% OFF
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{food.desc}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.isArray(food.category) ? food.category.map((cat, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {cat}
                    </Badge>
                  )) : null}
                </div>
              </CardContent>
              <Separator />
              <CardFooter className="p-4 flex justify-between">
                <Button variant="outline" onClick={() => handleViewDetails(food.id)}>
                  View Details
                </Button>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleAddToFavorites(food.id)}>
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button size="icon" onClick={() => handleAddToCart(food.id)}>
                    <ShoppingCart className="h-5 w-5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default HomePage

