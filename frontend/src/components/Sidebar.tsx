// ============================================================================
// src/components/Sidebar.tsx — Navigation Sidebar Component
// ============================================================================
//
// This component renders the left-hand navigation sidebar visible on all
// protected pages. It includes:
//   • Brand logo/name
//   • Navigation links (Dashboard, Explore, New Project, Notifications, Profile)
//   • Notification badge (shows count of pending requests)
//   • User info + logout button at the bottom
//   • Mobile-responsive: collapses to a hamburger menu on small screens
//
// REACT CONCEPTS USED:
//   • NavLink — Like <a> but with built-in "active" state detection
//   • useLocation — Hook that returns the current URL path
//   • useNavigate — Hook that returns a function to programmatically change URLs
//   • useEffect — Runs the notification count API call on every page navigation
//   • useState — Manages mobile sidebar open/close state and notification count
// ============================================================================

import { NavLink, useLocation, useNavigate } from "react-router-dom";
// NavLink    — Like a regular <Link> but adds an "active" CSS class when the
//              user is on that page. Great for highlighting the current nav item.
// useLocation — Returns an object with the current URL info (pathname, search, hash).
//               We use it as a dependency to re-fetch notifications on page changes.
// useNavigate — Returns a function to change the URL programmatically (like
//               window.location.href but without a full page reload).

import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { getIncomingRequests } from "../api/client";

// Icon imports from lucide-react — a library of clean SVG icon components.
// Each icon is a React component: <LayoutDashboard /> renders an SVG icon.
import {
    LayoutDashboard,
    Compass,
    FolderPlus,
    Bell,
    User,
    LogOut,
    Menu,
    X,
} from "lucide-react";

export default function Sidebar() {
    // ---- HOOKS ----
    // Hooks are special functions that "hook into" React features.
    // RULES: Hooks must be called at the TOP of the component (never inside if/for).

    const { profile, logout } = useAuth();      // Get user profile and logout function
    const navigate = useNavigate();              // Function to change URL: navigate("/login")
    const location = useLocation();              // Current URL info: { pathname: "/dashboard", ... }
    const [open, setOpen] = useState(false);     // Mobile sidebar open/close toggle
    const [notifCount, setNotifCount] = useState(0);  // Number of pending notifications

    // ---- FETCH NOTIFICATION COUNT ----
    // This useEffect runs every time the URL path changes (user navigates to a new page).
    // It calls the API to get the count of pending requests for the notification badge.
    useEffect(() => {
        getIncomingRequests()
            .then((r) => setNotifCount(r.filter((n) => (n as any).status === "PENDING").length))
            // .then() chains: the API returns an array → we filter for PENDING → count them
            // `as any` is a type cast that bypasses TypeScript checks (not ideal but works)
            .catch(() => { });
            // .catch() swallows errors silently — if the API fails, the badge just shows 0
    }, [location.pathname]);
    // ↑ [location.pathname] dependency: re-run when URL changes (e.g., /dashboard → /explore)

    // ---- LOGOUT HANDLER ----
    // Clears auth state (via context) and redirects to login page
    const handleLogout = () => {
        logout();                // Clear token + profile from AuthContext
        navigate("/login");     // Redirect to login page
    };

    // ---- COMPUTE INITIALS ----
    // For the avatar circle, we show the user's initials (e.g., "John Doe" → "JD").
    // This is a computed value — it recalculates on every render (which is fine,
    // it's a simple string operation, not an expensive computation).
    const initials =
        profile?.name                  // Optional chaining: if profile or name is null, stop here
            ?.split(" ")               // "John Doe" → ["John", "Doe"]
            .map((w) => w[0])          // ["John", "Doe"] → ["J", "D"]
            .join("")                  // ["J", "D"] → "JD"
            .slice(0, 2)              // Take max 2 characters
            .toUpperCase() || "?";    // Fallback to "?" if name is null

    // ---- NAVIGATION LINKS CONFIGURATION ----
    // This array defines all the sidebar navigation items.
    // Each object has: path, label, icon component, and optional badge count.
    // We .map() over this array below to render the links.
    const links = [
        { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
        { to: "/explore", label: "Explore", icon: <Compass /> },
        { to: "/projects/new", label: "New Project", icon: <FolderPlus /> },
        {
            to: "/notifications",
            label: "Notifications",
            icon: <Bell />,
            badge: notifCount > 0 ? notifCount : undefined,
            // `undefined` means "no badge" — the && check below won't render anything
        },
        { to: "/profile", label: "Profile", icon: <User /> },
    ];

    // ---- JSX (THE UI) ----
    // <> ... </> is a FRAGMENT — it lets you return multiple elements without adding
    // an extra wrapper div. Fragments don't create any DOM element.
    return (
        <>
            {/* ============================================================= */}
            {/* MOBILE HEADER — Only visible on small screens (via CSS)        */}
            {/* ============================================================= */}
            {/* On mobile, the sidebar is hidden. This header shows a hamburger */}
            {/* button to open it as a slide-over panel.                       */}
            <div className="mobile-header">
                <button onClick={() => setOpen(true)} aria-label="Open sidebar">
                    <Menu size={22} />
                </button>
                <h2>Converge</h2>
                {/* Empty div for flex spacing (pushes the title to center) */}
                <div style={{ width: 22 }} />
            </div>

            {/* OVERLAY — Semi-transparent backdrop behind the mobile sidebar */}
            {/* Clicking it closes the sidebar. Only renders when open=true.  */}
            {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

            {/* ============================================================= */}
            {/* SIDEBAR — The main navigation panel                           */}
            {/* ============================================================= */}
            {/* Template literal class: `sidebar ${open ? "open" : ""}`        */}
            {/* When open=true, adds the "open" class which triggers CSS to    */}
            {/* slide the sidebar into view on mobile.                         */}
            <aside className={`sidebar ${open ? "open" : ""}`}>
                {/* ---- BRAND SECTION ---- */}
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">C</div>
                    <h2>Converge</h2>
                    {/* Close button — only visible on mobile (display controlled by inline style) */}
                    <button
                        className="sidebar-logout"
                        style={{ marginLeft: "auto", display: open ? "flex" : "none" }}
                        onClick={() => setOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ---- NAVIGATION LINKS ---- */}
                <nav className="sidebar-nav">
                    <span className="sidebar-section-label">Navigation</span>
                    {/* .map() iterates over the links array and renders a NavLink for each */}
                    {links.map((l) => (
                        <NavLink
                            key={l.to}
                            // `key` is required for list items — React uses it to track changes
                            to={l.to}
                            // NavLink's className prop can be a FUNCTION that receives { isActive }.
                            // This is how NavLink knows to highlight the current page's link.
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? "active" : ""}`
                            }
                            onClick={() => setOpen(false)}  // Close mobile sidebar on navigation
                        >
                            {l.icon}
                            {l.label}
                            {/* Notification badge — only renders if l.badge is truthy */}
                            {l.badge && <span className="sidebar-badge">{l.badge}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* ---- FOOTER — User info + logout ---- */}
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">{initials}</div>
                        <div className="sidebar-user-info">
                            {/* Optional chaining: profile?.name safely handles null profile */}
                            <div className="name">{profile?.name || "User"}</div>
                            <div className="email">{profile?.email || ""}</div>
                        </div>
                        <button
                            className="sidebar-logout"
                            onClick={handleLogout}
                            title="Logout"
                            aria-label="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
