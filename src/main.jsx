import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <-- এটি ইমপোর্ট করতে হবে
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> {/* <-- App কম্পোনেন্টকে এর ভেতরে রাখতে হবে */}
      <App />
    </BrowserRouter>
  </StrictMode>,
)