import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import "@fontsource/geist-sans";
import "@fontsource/geist-mono";
import "@fontsource/inter-tight";
import "@fontsource/newsreader";
import './styles/index.css'
import App from './App.tsx'

// Register the offline service worker (same-origin only, so previews stay clean).
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is best-effort; the app works fine without it.
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)
