import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ViewerBanner from "./components/ViewerBanner";
import OnboardingGuide from "./components/OnboardingGuide";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import VendorRoute from "./components/VendorRoute";
const Home = lazy(() => import("./pages/Home"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const ChatRoom = lazy(() => import("./pages/ChatRoom"));
const Eats = lazy(() => import("./pages/Eats"));
const VendorDetail = lazy(() => import("./pages/VendorDetail"));
const EatsCheckout = lazy(() => import("./pages/EatsCheckout"));
const VendorDashboard = lazy(() => import("./pages/VendorDashboard"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const VendorSignup = lazy(() => import("./pages/VendorSignUp"));

function PageSpinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 3.5rem)",
      }}
    >
      <div
        style={{
          width: "1.5rem",
          height: "1.5rem",
          border: "2px solid var(--brand-blue)",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
    </div>
  );
}
export default function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Navbar />
      <ViewerBanner />
      <OnboardingGuide />
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/eats" element={<Eats />} />
          <Route path="/eats/vendor/:vendorId" element={<VendorDetail />} />
          <Route
            path="/vendor/signup"
            element={
              <ProtectedRoute>
                <VendorSignup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/eats/checkout"
            element={
              <ProtectedRoute>
                <EatsCheckout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/eats/vendor"
            element={
              <VendorRoute>
                <VendorDashboard />
              </VendorRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile/:uid" element={<Profile />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:chatId"
            element={
              <ProtectedRoute>
                <ChatRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/success"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/cancel"
            element={
              <ProtectedRoute>
                <PaymentCancel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
          <Route
            path="*"
            element={
              <div style={{ textAlign: "center", padding: "6rem 1rem" }}>
                <h1
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "5rem",
                    fontWeight: 800,
                    color: "var(--border-color)",
                  }}
                >
                  404
                </h1>
                <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  This page doesn't exist.
                </p>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
