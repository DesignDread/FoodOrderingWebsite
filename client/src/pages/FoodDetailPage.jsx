"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, ArrowLeft, Plus, Minus } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const FoodDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [food, setFood] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    fetchFoodDetails()
  }, [id])

  const fetchFoodDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/food/${id}`)
      setFood(response.data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching food details:", error)
      toast.error("Failed to load food details")
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    const token = localStorage.getItem("token")

    if (!token) {
      toast.error("Please login to add items to cart")
      navigate("/login")
      return
    }

    try {
      await axios.post(
        "http://localhost:8080/api/user/cart",
        { productId: id, quantity },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success(`Added ${quantity} item(s) to cart!`)
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Failed to add to cart")
    }
  }

  const handleAddToFavorites = async () => {
    const token = localStorage.getItem("token")

    if (!token) {
      toast.error("Please login to add items to favorites")
      navigate("/login")
      return
    }

    try {
      await axios.post(
        "http://localhost:8080/api/user/favorite",
        { productId: id },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success("Added to favorites!")
    } catch (error) {
      console.error("Error adding to favorites:", error)
      toast.error("Failed to add to favorites")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-screen">
        <p>Loading food details...</p>
      </div>
    )
  }

  if (!food) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-2xl font-bold">Food not found</h2>
        <Button variant="link" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-lg overflow-hidden">
          <img
            src={food.img || "/placeholder.svg?height=400&width=600"}
            alt={food.name}
            className="w-full h-[400px] object-cover"
            onError={(e) => {
              e.target.src = "/placeholder.svg?height=400&width=600"
            }}
          />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{food.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {food.category.map((cat, index) => (
                <Badge key={index} variant="secondary">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          <p className="text-muted-foreground">{food.desc}</p>

          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold">${food.price.org}</div>
            {food.price.off > 0 && (
              <>
                <div className="text-muted-foreground line-through">${food.price.mrp}</div>
                <Badge>{food.price.off}% OFF</Badge>
              </>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-2">Ingredients:</h3>
            <div className="flex flex-wrap gap-2">
              {food.ingredients.map((ingredient, index) => (
                <Badge key={index} variant="outline">
                  {ingredient}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center">{quantity}</span>
              <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={handleAddToCart} className="flex-1">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>

            <Button variant="outline" size="icon" onClick={handleAddToFavorites}>
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FoodDetailPage

