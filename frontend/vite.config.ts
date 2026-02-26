// ============================================================================
// vite.config.ts — Vite Build Tool Configuration
// ============================================================================
//
// WHAT IS VITE?
// Vite is a modern build tool (like Webpack, but much faster). It does two things:
//   1. DEV SERVER  — Runs your app locally with hot-reload (instant updates in browser)
//   2. PRODUCTION BUILD — Bundles all your files into optimised static assets for deployment
//
// This file configures how Vite behaves in both modes.
// It uses TypeScript, but Vite reads it directly (no separate compile step needed).
// ============================================================================

import { defineConfig } from 'vite'     // Helper function that gives you autocomplete/type-checking for the config
import react from '@vitejs/plugin-react' // Official Vite plugin that adds React support (JSX transform, Fast Refresh)

// https://vite.dev/config/
export default defineConfig({
  // ---------------------------------------------------------------------------
  // PLUGINS
  // Plugins extend Vite's capabilities. The React plugin does two key things:
  //   • Transforms JSX/TSX syntax into JavaScript the browser can understand
  //   • Enables "Fast Refresh" — when you edit a component, only that component
  //     re-renders (you don't lose the entire page state)
  // ---------------------------------------------------------------------------
  plugins: [react()],

  // ---------------------------------------------------------------------------
  // DEV SERVER CONFIGURATION
  // These settings ONLY apply when you run `npm run dev` (local development).
  // ---------------------------------------------------------------------------
  server: {
    // -------------------------------------------------------------------------
    // PROXY CONFIGURATION
    // -------------------------------------------------------------------------
    // PROBLEM: Your frontend runs on http://localhost:5173 (Vite's default port)
    //          but your backend API runs on http://127.0.0.1:8080.
    //          Browsers block requests between different origins (CORS).
    //
    // SOLUTION: The proxy tells Vite's dev server:
    //   "If a request starts with /auth or /api, don't serve it yourself —
    //    forward it to http://127.0.0.1:8080 instead."
    //
    // So when your frontend code calls `fetch('/auth/login')`, Vite intercepts it
    // and forwards it to `http://127.0.0.1:8080/auth/login`. The browser thinks
    // it's talking to the same server, so no CORS issues!
    //
    // NOTE: This proxy ONLY works in dev mode. In production, you'd configure
    //       your web server (e.g., Nginx) to handle this routing instead.
    // -------------------------------------------------------------------------
    proxy: {
      // Any request to /auth/* gets forwarded to the backend
      '/auth': {
        target: 'http://127.0.0.1:8080',  // Backend server address
        changeOrigin: true,                 // Modifies the request's Host header to match the target
      },
      // Any request to /api/* gets forwarded to the backend
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
