import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Customer Pages
import CustomerDashboard from "./pages/customer/Dashboard";

// Restaurant Pages
import RestaurantDashboard from "./pages/restaurant/Dashboard";

// Delivery Pages
import DeliveryDashboard from "./pages/delivery/Dashboard";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* Customer Routes */}
            <Route
              path="/customer"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/*"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Restaurant Routes */}
            <Route
              path="/restaurant"
              element={
                <ProtectedRoute allowedRoles={['restaurant']}>
                  <RestaurantDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/restaurant/*"
              element={
                <ProtectedRoute allowedRoles={['restaurant']}>
                  <RestaurantDashboard />
                </ProtectedRoute>
              }
            />

            {/* Delivery Routes */}
            <Route
              path="/delivery"
              element={
                <ProtectedRoute allowedRoles={['delivery']}>
                  <DeliveryDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/delivery/*"
              element={
                <ProtectedRoute allowedRoles={['delivery']}>
                  <DeliveryDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
