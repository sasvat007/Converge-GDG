// ============================================================================
// src/context/AuthContext.tsx — Authentication State Management
// ============================================================================
//
// WHAT IS REACT CONTEXT?
// In plain HTML/JS, you might store user data in a global variable or localStorage.
// In React, data flows DOWNWARD through "props" (parent → child). But what if
// a deeply nested component (like a page inside a layout) needs the user's login
// status? Passing props through every intermediate component is tedious.
//
// React Context solves this by creating a "global" data store that ANY component
// in the tree can access directly. It has two parts:
//   1. PROVIDER — Wraps the component tree and supplies the data
//   2. CONSUMER — Any child component that reads the data (via useContext hook)
//
// This file creates an AuthContext that stores:
//   - token:   The JWT authentication token (null if not logged in)
//   - profile: The user's profile data (null if not loaded yet)
//   - loading: Whether the initial auth check is still in progress
//   - setAuth: Function to log in (store token + profile)
//   - refreshProfile: Function to re-fetch profile from the API
//   - logout:  Function to log out (clear token + profile)
//
// USAGE IN OTHER FILES:
//   import { useAuth } from "../context/AuthContext";
//   const { token, profile, logout } = useAuth();
// ============================================================================

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
// createContext — Creates a new Context object
// useContext   — Hook to consume (read) a Context value
// useState     — Hook to create state variables that trigger re-renders when changed
// useEffect    — Hook to run side effects (API calls, subscriptions) after render
// ReactNode    — TypeScript type for "anything React can render" (JSX, strings, etc.)

import { getMyProfile } from "../api/client";  // API function to fetch user profile
import type { Profile } from "../types";       // TypeScript interface for profile shape
// `type` import means we're importing ONLY the type, not any runtime code

// ---------------------------------------------------------------------------
// CONTEXT TYPE DEFINITION
// ---------------------------------------------------------------------------
// This interface defines WHAT data/functions the context provides.
// Every component that calls useAuth() gets an object matching this shape.
interface AuthCtx {
    token: string | null;                              // JWT token or null if logged out
    profile: Profile | null;                           // User profile or null if not loaded
    loading: boolean;                                  // True while checking auth on app startup
    setAuth: (token: string, profile?: Profile | null) => void;  // Store login data
    refreshProfile: () => Promise<void>;               // Re-fetch profile from API
    logout: () => void;                                // Clear all auth data
}

// ---------------------------------------------------------------------------
// CREATE THE CONTEXT
// ---------------------------------------------------------------------------
// createContext() needs a DEFAULT value. This default is only used if a component
// tries to use useAuth() without an AuthProvider above it in the tree.
// In practice, App.tsx wraps everything in <AuthProvider>, so this default is
// just a fallback that satisfies TypeScript's type system.
const AuthContext = createContext<AuthCtx>({
    token: null,
    profile: null,
    loading: true,
    setAuth: () => { },
    refreshProfile: async () => { },
    logout: () => { },
});

// ============================================================================
// AUTH PROVIDER COMPONENT
// ============================================================================
// This component wraps the entire app (see App.tsx) and manages auth state.
// It provides the auth data to ALL child components via Context.
//
// { children }: { children: ReactNode } is a DESTRUCTURED PROP:
//   - `children` is a special React prop = whatever JSX is nested inside <AuthProvider>...</AuthProvider>
//   - This is how wrapper components work: they render `{children}` inside their own JSX
// ============================================================================
export function AuthProvider({ children }: { children: ReactNode }) {
    // ---- STATE VARIABLES ----
    // useState creates a reactive variable. When you call the setter (e.g., setToken),
    // React re-renders this component AND all its children.

    // Initialize token from localStorage (survives page refresh)
    // The `() => localStorage.getItem("token")` is a "lazy initializer" —
    // it only runs once on first render, not on every re-render.
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

    // Profile data — starts as null, loaded from API once token is available
    const [profile, setProfile] = useState<Profile | null>(null);

    // Loading flag — true until the initial profile fetch completes
    const [loading, setLoading] = useState(true);

    // ---- FETCH PROFILE FROM API ----
    // This function calls the backend to get the user's profile.
    // It's called on startup and whenever the token changes.
    const fetchProfile = async () => {
        if (!token) {
            // No token = not logged in, nothing to fetch
            setLoading(false);
            return;
        }
        try {
            const data = await getMyProfile();
            // `as unknown as Profile` is a TypeScript TYPE CAST.
            // The API returns Record<string, unknown> but we know it matches Profile.
            // `unknown` is TypeScript's safe "I don't know the type" (safer than `any`).
            setProfile(data as unknown as Profile);
        } catch {
            // If the API call fails (e.g., expired token, server error),
            // clear the auth state — the user needs to log in again
            localStorage.removeItem("token");
            setToken(null);
            setProfile(null);
        } finally {
            // `finally` runs whether the try succeeded or caught an error
            setLoading(false);
        }
    };

    // ---- useEffect: RUN ON TOKEN CHANGE ----
    // useEffect runs AFTER the component renders. The [token] dependency array
    // means: "re-run this effect every time `token` changes".
    //
    // WHEN DOES THIS RUN?
    //   1. On first render (app startup) — checks if stored token is still valid
    //   2. After login (setToken is called) — fetches the new user's profile
    //   3. After logout (token set to null) — clears profile
    useEffect(() => {
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        // ^ This comment tells ESLint to ignore a warning about missing dependencies.
        //   fetchProfile uses `token` but we intentionally only want to depend on [token].
    }, [token]);

    // ---- LOGIN FUNCTION ----
    // Called after successful API login. Stores token in both:
    //   1. localStorage (persists across page refreshes / browser restarts)
    //   2. React state (triggers re-renders so the UI updates)
    const setAuth = (t: string, p?: Profile | null) => {
        localStorage.setItem("token", t);
        setToken(t);       // This triggers the useEffect above, which fetches profile
        if (p) setProfile(p);
    };

    // ---- REFRESH PROFILE ----
    // Manually re-fetches the profile from the API.
    // Useful after the user updates their profile.
    const refreshProfile = async () => {
        await fetchProfile();
    };

    // ---- LOGOUT FUNCTION ----
    // Clears all auth data. The useEffect will fire (token → null),
    // and ProtectedLayout will redirect to /login.
    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setProfile(null);
    };

    // ---- RENDER ----
    // AuthContext.Provider makes the `value` object available to all children.
    // Any component calling useAuth() will get this exact object.
    return (
        <AuthContext.Provider value={{ token, profile, loading, setAuth, refreshProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// ---- CUSTOM HOOK ----
// A shortcut for components to access auth data.
// Instead of writing `useContext(AuthContext)` everywhere, components just write `useAuth()`.
// This is a common React pattern called a "custom hook".
export const useAuth = () => useContext(AuthContext);
