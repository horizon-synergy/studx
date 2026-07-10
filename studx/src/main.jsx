// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider }       from './context/ThemeContext'
import { AuthProvider }        from './context/AuthContext'
import { CartProvider }        from './context/CartContext'
import { NotificationProvider } from './context/NotificationContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)
