import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ConfirmEmail from "./pages/ConfirmEmail";
import EmailVerified from "./pages/EmailVerified";
import NotFound from "./pages/NotFound";

// Customer Pages
import CustomerDashboard from "./pages/customer/Dashboard";
import RestaurantList from "./pages/customer/RestaurantList";
import Explore from "./pages/customer/Explore";
import RestaurantMenu from "./pages/customer/RestaurantMenu";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import OrderSuccess from "./pages/customer/OrderSuccess";
import Orders from "./pages/customer/Orders";
import OrderTracking from "./pages/customer/OrderTracking";
import CustomerProfile from "./pages/customer/Profile";
import CustomerCoins from "./pages/customer/Coins";
import PublicProfile from "./pages/customer/PublicProfile";
import FollowersList from "./pages/customer/FollowersList";
import Conversations from "./pages/customer/Conversations";
import ChatView from "./pages/customer/ChatView";
import CustomerNotifications from "./pages/customer/Notifications";
import { UsernameSetup } from "./components/customer/UsernameSetup";
// Restaurant Pages
import RestaurantDashboard from "./pages/restaurant/Dashboard";
import RestaurantOrders from "./pages/restaurant/Orders";
import MenuManagement from "./pages/restaurant/MenuManagement";
import RestaurantSettings from "./pages/restaurant/Settings";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminOrders from "./pages/admin/Orders";
import AdminPayouts from "./pages/admin/Payouts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <LocationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/confirm-email" element={<ConfirmEmail />} />
              <Route path="/email-verified" element={<EmailVerified />} />
              <Route path="/auth" element={<Navigate to="/login" replace />} />

              {/* Customer Routes */}
              <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><CustomerDashboard /></UsernameSetup></ProtectedRoute>} />
              <Route path="/customer/explore" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><Explore /></UsernameSetup></ProtectedRoute>} />
              <Route path="/customer/browse" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><RestaurantList /></UsernameSetup></ProtectedRoute>} />
              <Route path="/customer/restaurant/:id" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><RestaurantMenu /></UsernameSetup></ProtectedRoute>} />
              <Route path="/customer/cart" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><Cart /></UsernameSetup></ProtectedRoute>} />
              <Route path="/customer/checkout" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><Checkout /></UsernameSetup></ProtectedRoute>} />
              <Route path="/customer/order-success/:id" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><OrderSuccess /></UsernameSetup></ProtectedRoute>} />
              <Route path="/customer/orders" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><Orders /></UsernameSetup></ProtectedRoute>} />
              <Route path="/customer/orders/:id" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><OrderTracking /></UsernameSetup></ProtectedRoute>} />
              <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><CustomerProfile /></UsernameSetup></ProtectedRoute>} />
              <Route path="/customer/coins" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><CustomerCoins /></UsernameSetup></ProtectedRoute>} />
              <Route path="/customer/profile/:type" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><FollowersList /></UsernameSetup></ProtectedRoute>} />
              <Route path="/customer/user/:userId" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><PublicProfile /></UsernameSetup></ProtectedRoute>} />
              <Route path="/customer/messages" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><Conversations /></UsernameSetup></ProtectedRoute>} />
              <Route path="/customer/chat/:conversationId" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><ChatView /></UsernameSetup></ProtectedRoute>} />
              <Route path="/customer/*" element={<ProtectedRoute allowedRoles={['customer']}><UsernameSetup><CustomerDashboard /></UsernameSetup></ProtectedRoute>} />

              {/* Restaurant Routes */}
              <Route path="/restaurant" element={<ProtectedRoute allowedRoles={['restaurant']}><RestaurantDashboard /></ProtectedRoute>} />
              <Route path="/restaurant/orders" element={<ProtectedRoute allowedRoles={['restaurant']}><RestaurantOrders /></ProtectedRoute>} />
              <Route path="/restaurant/menu" element={<ProtectedRoute allowedRoles={['restaurant']}><MenuManagement /></ProtectedRoute>} />
              <Route path="/restaurant/settings" element={<ProtectedRoute allowedRoles={['restaurant']}><RestaurantSettings /></ProtectedRoute>} />
              <Route path="/restaurant/*" element={<ProtectedRoute allowedRoles={['restaurant']}><RestaurantDashboard /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrders /></ProtectedRoute>} />
              <Route path="/admin/payouts" element={<ProtectedRoute allowedRoles={['admin']}><AdminPayouts /></ProtectedRoute>} />
              <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </LocationProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
