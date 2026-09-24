import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { RouteSeo } from "@/components/seo/Seo";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import { OneSignalInit } from "@/components/OneSignalInit";
import { OfflineBanner } from "@/components/OfflineBanner";

// Pages
import Index from "./pages/Index";
import RoleSelect from "./pages/RoleSelect";
import Login from "./pages/Login";
import CustomerSignup from "./pages/signup/CustomerSignup";
import RestaurantSignup from "./pages/signup/RestaurantSignup";
import ConfirmEmail from "./pages/ConfirmEmail";
import EmailVerified from "./pages/EmailVerified";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ProfileLanding from "./pages/ProfileLanding";

// Customer Pages
import CustomerDashboard from "./pages/customer/Dashboard";
import RestaurantList from "./pages/customer/RestaurantList";
import RestaurantMenu from "./pages/customer/RestaurantMenu";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import OrderSuccess from "./pages/customer/OrderSuccess";
import Orders from "./pages/customer/Orders";
import OrderTracking from "./pages/customer/OrderTracking";
import CustomerProfile from "./pages/customer/Profile";
import CustomerCoins from "./pages/customer/Coins";
import CustomerNotifications from "./pages/customer/Notifications";
import NotificationSettings from "./pages/customer/NotificationSettings";
import ProfileSettings from "./pages/customer/ProfileSettings";
// Restaurant Pages
import RestaurantDashboard from "./pages/restaurant/Dashboard";
import RestaurantOrders from "./pages/restaurant/Orders";
import RestaurantOrderDetail from "./pages/restaurant/OrderDetail";
import MenuManagement from "./pages/restaurant/MenuManagement";
import RestaurantSettings from "./pages/restaurant/Settings";
import RestaurantNotifications from "./pages/restaurant/Notifications";
import RestaurantNotificationSettings from "./pages/restaurant/NotificationSettings";
import RestaurantOnboarding from "./pages/restaurant/Onboarding";
import RestaurantPayouts from "./pages/restaurant/Payouts";
import { OnboardingGuard } from "./components/restaurant/OnboardingGuard";

// Legal Pages
import TermsOfService from "./pages/legal/TermsOfService";
import CommunityGuidelines from "./pages/legal/CommunityGuidelines";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import CancellationRefundPolicy from "./pages/legal/CancellationRefundPolicy";
import AboutUs from "./pages/legal/AboutUs";
import ContactUs from "./pages/legal/ContactUs";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminRestaurants from "./pages/admin/Restaurants";
import AdminOrders from "./pages/admin/Orders";
import AdminPayouts from "./pages/admin/Payouts";
import AdminRefunds from "./pages/admin/Refunds";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 7, // keep cached data for 7 days for offline use
      staleTime: 1000 * 30,
      networkMode: 'offlineFirst',
      retry: 1,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'munchii-rq-cache',
  throttleTime: 1500,
});

const App = () => {
  return (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      dehydrateOptions: {
        // Persist lightweight customer data for a fast return to the app.
        shouldDehydrateQuery: (q) => {
          const key = q.queryKey?.[0];
          return key === 'profile' || key === 'wallet' || key === 'customer-orders' || key === 'restaurants';
        },
      },
    }}
  >
    <TooltipProvider>
      <AuthProvider>
        <OneSignalInit />
        <OfflineBanner />
        <CartProvider>
          <LocationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteSeo />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<RoleSelect />} />
              <Route path="/home" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<CustomerSignup />} />
              <Route path="/signup/customer" element={<CustomerSignup />} />
              <Route path="/signup/restaurant" element={<RestaurantSignup />} />
              <Route path="/confirm-email" element={<ConfirmEmail />} />
              <Route path="/email-verified" element={<EmailVerified />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth" element={<Navigate to="/login" replace />} />
              <Route path="/u/:userId" element={<ProfileLanding />} />

              {/* Legal Pages */}
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/community-guidelines" element={<CommunityGuidelines />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/cancellation-refund" element={<CancellationRefundPolicy />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<ContactUs />} />

              {/* Customer Routes */}
              <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
              <Route path="/customer/browse" element={<ProtectedRoute allowedRoles={['customer']}><RestaurantList /></ProtectedRoute>} />
              <Route path="/customer/restaurant/:id" element={<ProtectedRoute allowedRoles={['customer']}><RestaurantMenu /></ProtectedRoute>} />
              <Route path="/customer/cart" element={<ProtectedRoute allowedRoles={['customer']}><Cart /></ProtectedRoute>} />
              <Route path="/customer/checkout" element={<ProtectedRoute allowedRoles={['customer']}><Checkout /></ProtectedRoute>} />
              <Route path="/customer/order-success/:id" element={<ProtectedRoute allowedRoles={['customer']}><OrderSuccess /></ProtectedRoute>} />
              <Route path="/customer/orders" element={<ProtectedRoute allowedRoles={['customer']}><Orders /></ProtectedRoute>} />
              <Route path="/customer/orders/:id" element={<ProtectedRoute allowedRoles={['customer']}><OrderTracking /></ProtectedRoute>} />
              <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={['customer']}><CustomerProfile /></ProtectedRoute>} />
              <Route path="/customer/profile/settings" element={<ProtectedRoute allowedRoles={['customer']}><ProfileSettings /></ProtectedRoute>} />
              <Route path="/customer/coins" element={<ProtectedRoute allowedRoles={['customer']}><CustomerCoins /></ProtectedRoute>} />
              <Route path="/customer/notifications" element={<ProtectedRoute allowedRoles={['customer']}><CustomerNotifications /></ProtectedRoute>} />
              <Route path="/customer/notification-settings" element={<ProtectedRoute allowedRoles={['customer']}><NotificationSettings /></ProtectedRoute>} />
              <Route path="/customer/explore" element={<Navigate to="/customer" replace />} />
              <Route path="/customer/messages" element={<Navigate to="/customer" replace />} />
              <Route path="/customer/chat/*" element={<Navigate to="/customer" replace />} />
              <Route path="/customer/club/*" element={<Navigate to="/customer" replace />} />
              <Route path="/customer/user/*" element={<Navigate to="/customer" replace />} />
              <Route path="/customer/profile/:type" element={<Navigate to="/customer/profile" replace />} />
              <Route path="/customer/chat-settings" element={<Navigate to="/customer/profile/settings" replace />} />
              <Route path="/customer/account-privacy" element={<Navigate to="/customer/profile/settings" replace />} />
              <Route path="/customer/blocked-users" element={<Navigate to="/customer/profile/settings" replace />} />
              <Route path="/customer/*" element={<Navigate to="/customer" replace />} />

              {/* Restaurant Routes */}
              <Route path="/restaurant/onboarding" element={<ProtectedRoute allowedRoles={['restaurant']}><RestaurantOnboarding /></ProtectedRoute>} />
              <Route path="/restaurant" element={<ProtectedRoute allowedRoles={['restaurant']}><OnboardingGuard><RestaurantDashboard /></OnboardingGuard></ProtectedRoute>} />
              <Route path="/restaurant/orders" element={<ProtectedRoute allowedRoles={['restaurant']}><OnboardingGuard><RestaurantOrders /></OnboardingGuard></ProtectedRoute>} />
              <Route path="/restaurant/orders/:orderId" element={<ProtectedRoute allowedRoles={['restaurant']}><OnboardingGuard><RestaurantOrderDetail /></OnboardingGuard></ProtectedRoute>} />
              <Route path="/restaurant/menu" element={<ProtectedRoute allowedRoles={['restaurant']}><OnboardingGuard><MenuManagement /></OnboardingGuard></ProtectedRoute>} />
              <Route path="/restaurant/settings" element={<ProtectedRoute allowedRoles={['restaurant']}><OnboardingGuard><RestaurantSettings /></OnboardingGuard></ProtectedRoute>} />
              <Route path="/restaurant/payouts" element={<ProtectedRoute allowedRoles={['restaurant']}><OnboardingGuard><RestaurantPayouts /></OnboardingGuard></ProtectedRoute>} />
              <Route path="/restaurant/notifications" element={<ProtectedRoute allowedRoles={['restaurant']}><RestaurantNotifications /></ProtectedRoute>} />
              <Route path="/restaurant/notification-settings" element={<ProtectedRoute allowedRoles={['restaurant']}><RestaurantNotificationSettings /></ProtectedRoute>} />
              <Route path="/restaurant/*" element={<ProtectedRoute allowedRoles={['restaurant']}><OnboardingGuard><RestaurantDashboard /></OnboardingGuard></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/restaurants" element={<ProtectedRoute allowedRoles={['admin']}><AdminRestaurants /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrders /></ProtectedRoute>} />
              <Route path="/admin/payouts" element={<ProtectedRoute allowedRoles={['admin']}><AdminPayouts /></ProtectedRoute>} />
              <Route path="/admin/refunds" element={<ProtectedRoute allowedRoles={['admin']}><AdminRefunds /></ProtectedRoute>} />
              <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </LocationProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </PersistQueryClientProvider>
  </ThemeProvider>
  );
};

export default App;
