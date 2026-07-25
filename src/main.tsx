import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "@fontsource/geist-sans";
import "@fontsource/inter-tight";
import "@fontsource/newsreader";
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
