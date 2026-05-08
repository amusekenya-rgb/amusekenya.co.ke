import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { SupabaseAuthProvider } from '@/hooks/useSupabaseAuth'
import { RuntimeErrorBoundary } from '@/components/RuntimeErrorBoundary'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <SupabaseAuthProvider>
      <RuntimeErrorBoundary>
        <App />
      </RuntimeErrorBoundary>
    </SupabaseAuthProvider>
  </HelmetProvider>
);
