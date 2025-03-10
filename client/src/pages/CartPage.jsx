"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Trash, Plus, Minus, ShoppingBag } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

const CartPage = () => {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [address, setAddress] = useState("")
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCartItems()
  }, [])

  const fetchCartItems = async () => {
    const token = localStorage.getItem("token")

    if (!token) {
      toast.error("Please login to view your cart")
      navigate("/login")
      return
    }

    try {
      const response = await axios.get("http://localhost:8080/api/user/cart", {
        headers: { Authorization: `Bearer ${token}` },
      })

      setCartItems(response.data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching cart items:", error)
      toast.error("Failed to load cart items")
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (productId, newQuantity) => {
    const token = localStorage.getItem("token")

    if (newQuantity <= 0) {
      handleRemoveItem(productId)
      return
    }

    try {
      // First remove the item
      await axios.patch(
        "http://localhost:8080/api/user/cart",
        { productId, quantity: 1000 }, // Remove all
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Then add with new quantity
      await axios.post(
        "http://localhost:8080/api/user/cart",
        { productId, quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Update local state
      setCartItems(cartItems.map((item) => (item.product.id === productId ? { ...item, quantity: newQuantity } : item)))

      toast.success("Cart updated")
    } catch (error) {
      console.error("Error updating cart:", error)
      toast.error("Failed to update cart")
    }
  }

  const handleRemoveItem = async (productId) => {
    const token = localStorage.getItem("token")

    try {
      await axios.patch(
        "http://localhost:8080/api/user/cart",
        { productId },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Update local state
      setCartItems(cartItems.filter((item) => item.product.id !== productId))

      toast.success("Item removed from cart")
    } catch (error) {
      console.error("Error removing item:", error)
      toast.error("Failed to remove item")
    }
  }

  const handleCheckout = async () => {
    if (!address.trim()) {
      toast.error("Please enter your delivery address")
      return
    }

    const token = localStorage.getItem("token")

    try {
      const totalAmount = calculateTotal()
      const products = cartItems.map((item) => ({
        product: item.product.id,
        quantity: item.quantity,
      }))

      await axios.post(
        "http://localhost:8080/api/user/order",
        { products, address, totalAmount },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success("Order placed successfully!")
      setCheckoutOpen(false)
      setCartItems([])
    } catch (error) {
      console.error("Error placing order:", error)
      toast.error("Failed to place order")
    }
  }

  const calculateTotal = () => {
    return cartItems
      .reduce((total, item) => {
        return total + item.product.price.org * item.quantity
      }, 0)
      .toFixed(2)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-screen">
        <p>Loading cart items...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping
        </Button>
        <h1 className="text-2xl font-bold">Your Cart</h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-10">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <p className="text-muted-foreground">Add some items to your cart to see them here</p>
          <Button className="mt-4" onClick={() => navigate("/")}>
            Browse Foods
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.product.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.product.img || "/placeholder.svg?height=100&width=100"}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-md"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=100&width=100"
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.product.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{item.product.desc}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="font-medium">${(item.product.price.org * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${calculateTotal()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>$0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${calculateTotal()}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">Checkout</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Complete Your Order</DialogTitle>
                      <DialogDescription>Enter your delivery address to place your order.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="address">Delivery Address</Label>
                        <Textarea
                          id="address"
                          placeholder="Enter your full address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Order Summary</h4>
                        <div className="text-sm space-y-1">
                          {cartItems.map((item) => (
                            <div key={item.product.id} className="flex justify-between">
                              <span>
                                {item.quantity} x {item.product.name}
                              </span>
                              <span>${(item.product.price.org * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span>${calculateTotal()}</span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCheckout}>Place Order</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default CartPage

