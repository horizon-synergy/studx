import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { FoodCartProvider } from "./context/FoodCartContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ViewerProvider } from "./context/ViewerContext";
import App from "./App";
import "./index.css";

registerSW({
  onNeedRefresh() {
    if (confirm("A new version of StudX is available. Reload now?")) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log("StudX is ready to work offline.");
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <FoodCartProvider>
            <NotificationProvider>
              <ViewerProvider>
                <App />
              </ViewerProvider>
            </NotificationProvider>
          </FoodCartProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
