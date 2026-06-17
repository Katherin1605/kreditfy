import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ExchangeRatesProvider } from './context/ExchangeRatesContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ExchangeRatesProvider>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </ExchangeRatesProvider>
    </AuthProvider>
  </StrictMode>,
)
