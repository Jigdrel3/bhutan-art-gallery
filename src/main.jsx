import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin'

const App = lazy(() => import('./App.jsx'))
const Admin = lazy(() => import('./Admin.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={null}>{isAdmin ? <Admin /> : <App />}</Suspense>
  </StrictMode>,
)
