import { Toaster } from "react-hot-toast";
import HomePage from "./pages/HomePage"; // Make sure to import these components
import { Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CartPage from "./pages/CartPage";
import FavouritePage from "./pages/FavouritePage";
import RegisterPage from "./pages/RegisterPage";
import FoodDetailPage from "./pages/FoodDetailPage";
import Header from "./components/Header";
import Profile from "./pages/Profile"
function App() {
  return (
    <>
      <Header />
      <Routes>
        
        <Route path='/' element={<HomePage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/cart' element={<CartPage />} />
        <Route path='/favourite' element={<FavouritePage />} />
        <Route path="/food/:id" element={<FoodDetailPage />} />
        <Route path="/profile" element={<Profile/>}></Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
