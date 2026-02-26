// ============================================================================
// App.tsx — Root Component & Route Definitions
// ============================================================================
//
// This is the TOP-LEVEL component of the entire application. Every page,
// layout, and feature is nested inside this component.
//
// KEY CONCEPTS:
//
// 1. COMPONENTS — In React, you build UIs by composing "components" (reusable
//    pieces of UI). Each component is a function that returns JSX (HTML-like syntax).
//    Components are like custom HTML tags: <LoginPage />, <Sidebar />, etc.
//
// 2. ROUTING — In a traditional website, each page is a separate HTML file.
//    In React (a "Single-Page App" or SPA), there's only ONE HTML file.
//    React Router swaps which component is visible based on the URL.
//    Navigation feels instant because no full page reload happens.
//
// 3. PROVIDERS — Components that wrap your app to share data (like auth state,
//    toast messages) with ALL child components, without passing props manually
//    through every level. This pattern is called "React Context".
// ============================================================================

// --- IMPORTS ---

// React Router imports for client-side routing:
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// • BrowserRouter — Wraps the app to enable routing. Uses the browser's URL bar.
// • Routes       — Container for all <Route> elements. Only ONE route matches at a time.
// • Route        — Maps a URL path to a component. e.g., path="/login" → <LoginPage />
// • Navigate     — Programmatic redirect. Renders nothing but changes the URL.

// Context Providers (share global state with all components):
import { AuthProvider } from "./context/AuthContext";     // Auth state (token, profile, login/logout)
import { ToastProvider } from "./context/ToastContext";   // Toast notifications (success/error popups)

// Layout component (wraps protected pages with sidebar + auth guard):
import ProtectedLayout from "./components/ProtectedLayout";

// Page components (each corresponds to a URL route):
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ExplorePage from "./pages/ExplorePage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import CreateProjectPage from "./pages/CreateProjectPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";

// Global styles for the entire application (layout, forms, cards, etc.)
import "./App.css";

// ============================================================================
// APP COMPONENT
// ============================================================================
// `export default function App()` means:
//   - export default: other files can import this component
//   - function App(): a React "function component" — a function that returns JSX
//
// The JSX returned describes WHAT to render, not HOW. React handles the DOM updates.
// ============================================================================
export default function App() {
  return (
    // =========================================================================
    // PROVIDER NESTING ORDER (outermost → innermost)
    // =========================================================================
    // Providers must wrap the components that need them. The nesting order matters:
    //
    //   BrowserRouter  (routing must be outermost — everything needs URL access)
    //     └─ AuthProvider   (auth state — needed by ProtectedLayout and pages)
    //         └─ ToastProvider  (toast notifications — can be used anywhere)
    //             └─ Routes     (actual page content)
    //
    // Each provider uses React Context to make its data available to ALL children.
    // =========================================================================
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* ============================================================= */}
            {/* PUBLIC ROUTES — Accessible without logging in                  */}
            {/* ============================================================= */}
            {/* These routes have NO auth guard. Anyone can visit them.        */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ============================================================= */}
            {/* PROTECTED ROUTES — Require authentication                     */}
            {/* ============================================================= */}
            {/* ProtectedLayout is a "layout route" — it wraps all child      */}
            {/* routes with:                                                   */}
            {/*   1. An auth check (redirects to /login if not logged in)     */}
            {/*   2. The Sidebar navigation                                   */}
            {/*   3. A <main> container where the child page renders          */}
            {/*                                                               */}
            {/* The `element` prop has NO `path` — it just wraps children.    */}
            {/* Child routes render inside ProtectedLayout's <Outlet />.      */}
            {/* ============================================================= */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/projects/new" element={<CreateProjectPage />} />
              {/* :id is a URL PARAMETER — a dynamic segment.                 */}
              {/* Visiting /projects/42 sets id = "42".                       */}
              {/* The component reads it with useParams().                    */}
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* ============================================================= */}
            {/* FALLBACK / CATCH-ALL ROUTE                                    */}
            {/* ============================================================= */}
            {/* path="*" matches ANY URL not matched above.                   */}
            {/* <Navigate to="/dashboard" replace /> redirects there.         */}
            {/* `replace` means it replaces the current browser history entry */}
            {/* so the user can't click "Back" to return to the invalid URL.  */}
            {/* ============================================================= */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
