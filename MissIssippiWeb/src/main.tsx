import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './assets/css/bootstrap.min.css';
import './assets/css/App.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import router from './routes.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
