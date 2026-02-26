// ============================================================================
// src/components/ProtectedLayout.tsx — Auth Guard + App Shell Layout
// ============================================================================
//
// WHAT IS A "LAYOUT ROUTE"?
// In React Router, a layout route is a component that wraps other pages.
// It doesn't have its own URL path — instead, it provides shared UI (like a
// sidebar, header, or footer) around whatever page is currently active.
//
// HOW IT WORKS IN THIS APP:
// In App.tsx, you'll see:
//   <Route element={<ProtectedLayout />}>
//     <Route path="/dashboard" element={<DashboardPage />} />
//     <Route path="/explore" element={<ExplorePage />} />
//     ...
//   </Route>
//
// When the user visits /dashboard, React Router renders:
//   <ProtectedLayout>
//     <DashboardPage />     ← injected via <Outlet />
//   </ProtectedLayout>
//
// TWO RESPONSIBILITIES:
// 1. AUTH GUARD — If the user isn't logged in, redirect to /login
// 2. LAYOUT    — Wrap every protected page with the sidebar + main container
// ============================================================================

import { Navigate, Outlet } from "react-router-dom";
// Navigate — Component that performs a redirect when rendered
// Outlet   — Placeholder component that renders the matched child route
//            Think of it like a "slot" where the current page gets inserted

import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

export default function ProtectedLayout() {
    // Read auth state from the AuthContext
    const { token, loading } = useAuth();

    // ---- LOADING STATE ----
    // On first app load, AuthContext fetches the profile from the API.
    // While that request is in-flight, `loading` is true.
    // We show a spinner to avoid a flash of the login page.
    if (loading) {
        return (
            <div className="spinner-overlay">
                <div className="spinner" />
            </div>
        );
    }

    // ---- AUTH CHECK ----
    // If there's no token (user not logged in), redirect to the login page.
    // `replace` means this redirect replaces the current history entry,
    // so pressing the browser's Back button won't bring them back here.
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // ---- AUTHENTICATED LAYOUT ----
    // If the user IS logged in, render the app shell:
    //   - Sidebar on the left (navigation links)
    //   - Main content area on the right (where the current page renders)
    //
    // <Outlet /> is the magic part — it renders whichever child Route matches
    // the current URL. Visiting /dashboard → <Outlet /> = <DashboardPage />
    return (
        <div className="app-shell">
            <Sidebar />
            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
}
