import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "@fontsource/geist-sans";
import "@fontsource/inter-tight";
import "@fontsource/newsreader";
import './styles/index.css'
import App from './App.tsx'

// Unregister any legacy Service Worker from old app versions
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
