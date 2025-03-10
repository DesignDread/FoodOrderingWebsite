"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, ArrowLeft } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const FavouritePage = () => {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    const token = localStorage.getItem("token")

    if (!token) {
      toast.error("Please login to view your favorites")
      navigate("/login")
      return
    }

    try {
      const response = await axios.get("http://localhost:8080/api/user/favorite", {
        headers: { Authorization: `Bearer ${token}` },
      })

      setFavorites(response.data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching favorites:", error)
      toast.error("Failed to load favorites")
      setLoading(false)
    }
  }

  const handleRemoveFromFavorites = async (productId) => {
    const token = localStorage.getItem("token")

    try {
      await axios.patch(
        "http://localhost:8080/api/user/favorite",
        { productId },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Update local state
      setFavorites(favorites.filter((item) => item.id !== productId))

      toast.success("Removed from favorites")
    } catch (error) {
      console.error("Error removing from favorites:", error)
      toast.error("Failed to remove from favorites")
    }
  }

  const handleAddToCart = async (productId) => {
    const token = localStorage.getItem("token")

    try {
      await axios.post(
        "http://localhost:8080/api/user/cart",
        { productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success("Added to cart!")
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Failed to add to cart")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-screen">
        <p>Loading favorites...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
        <h1 className="text-2xl font-bold">Your Favorites</h1>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-10">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No favorites yet</h2>
          <p className="text-muted-foreground">Items you add to your favorites will appear here</p>
          <Button className="mt-4" onClick={() => navigate("/")}>
            Browse Foods
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((food) => (
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
                  {food.category.map((cat, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <Separator />
              <CardFooter className="p-4 flex justify-between">
                <Button variant="outline" onClick={() => navigate(`/food/${food.id}`)}>
                  View Details
                </Button>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" onClick={() => handleRemoveFromFavorites(food.id)}>
                    <Heart className="h-5 w-5 fill-current" />
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

export default FavouritePage

