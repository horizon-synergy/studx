import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function VendorRoute({ children }) {
  const { currentUser, isVendor, isAdmin, loading } = useAuth()
  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!isVendor && !isAdmin) return <Navigate to="/eats" replace />;
  return children;
}