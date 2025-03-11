import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Heart, Save, Clock } from "lucide-react";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    try {
      console.log("Fetching user data for profile page");
      const storedUser = localStorage.getItem("user");
      console.log("Raw stored user data:", storedUser);
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("Parsed user data:", parsedUser);
        setUser(parsedUser);
        // Initialize form data with user info
        setFormData({
          name: parsedUser.name || "",
          email: parsedUser.email || "",
          phone: parsedUser.phone || "",
          address: parsedUser.address || ""
        });
      } else {
        console.log("No user found in localStorage");
        navigate("/login");
      }
    } catch (error) {
      console.error("Error retrieving user from localStorage:", error);
      navigate("/login");
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = () => {
    try {
      // Update the user object with new information
      const updatedUser = {
        ...user,
        ...formData
      };
      
      // Save to localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      // Update state
      setUser(updatedUser);
      setIsEditing(false);
      
      console.log("Profile updated successfully:", updatedUser);
      // In a real app, you would also send this data to your backend
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const [activeTab, setActiveTab] = useState("profile");

  if (!user) {
    return <div className="container mx-auto p-4 text-center">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <button 
        className="flex items-center text-blue-600 mb-4 px-4 py-2 rounded hover:bg-gray-100"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </button>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Sidebar */}
        <div className="w-full md:w-1/3">
          <div className="border rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex flex-col items-center">
                <div className="h-24 w-24 mb-4 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user.img ? (
                    <img src={user.img} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-2xl font-bold text-gray-500">{getInitials(user.name)}</div>
                  )}
                </div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-gray-500">{user.email}</p>
                
                <div className="w-full mt-6">
                  <button 
                    className="w-full mb-2 flex items-center justify-center border rounded-md py-2 px-4 hover:bg-gray-50"
                    onClick={() => navigate("/cart")}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    My Orders
                  </button>
                  <button 
                    className="w-full mb-2 flex items-center justify-center border rounded-md py-2 px-4 hover:bg-gray-50"
                    onClick={() => navigate("/favourite")}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Favorites
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="w-full md:w-2/3">
          <div className="border-b mb-4">
            <div className="flex">
              <button
                className={`px-4 py-2 font-medium ${activeTab === "profile" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
                onClick={() => setActiveTab("profile")}
              >
                Profile
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === "orders" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
                onClick={() => setActiveTab("orders")}
              >
                Order History
              </button>
            </div>
          </div>
          
          {activeTab === "profile" && (
            <div className="border rounded-lg shadow-sm">
              <div className="border-b p-4">
                <h3 className="text-xl font-semibold">Profile Information</h3>
                <p className="text-gray-500 text-sm">
                  {isEditing 
                    ? "Edit your personal information below" 
                    : "View and manage your personal information"
                  }
                </p>
              </div>
              <div className="p-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
                      <input 
                        id="name"
                        name="name"
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address</label>
                      <input 
                        id="email"
                        name="email"
                        type="email"
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone Number</label>
                      <input 
                        id="phone"
                        name="phone"
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.phone || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium mb-1">Delivery Address</label>
                      <input 
                        id="address"
                        name="address"
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.address || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Full Name</p>
                        <p>{user.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email Address</p>
                        <p>{user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone Number</p>
                        <p>{user.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Delivery Address</p>
                        <p>{user.address || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t p-4 flex justify-end">
                {isEditing ? (
                  <>
                    <button 
                      className="px-4 py-2 border rounded-md mr-2 hover:bg-gray-50"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                      onClick={handleSaveProfile}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          )}
          
          {activeTab === "orders" && (
            <div className="border rounded-lg shadow-sm">
              <div className="border-b p-4">
                <h3 className="text-xl font-semibold">Order History</h3>
                <p className="text-gray-500 text-sm">
                  View your past orders and their status
                </p>
              </div>
              <div className="p-4">
                {/* Mock order history - in a real app, you would fetch this from an API */}
                {user.orders && user.orders.length > 0 ? (
                  <div className="space-y-4">
                    {user.orders.map((order, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">Order #{order.id}</div>
                          <div className="text-sm text-gray-500">{order.date}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-orange-500" />
                            <span className="text-sm">{order.status}</span>
                          </div>
                          <div className="font-medium">${order.total.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">You haven't placed any orders yet</p>
                    <button 
                      className="mt-4 px-4 py-2 border rounded-md hover:bg-gray-50"
                      onClick={() => navigate("/")}
                    >
                      Browse Restaurants
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;