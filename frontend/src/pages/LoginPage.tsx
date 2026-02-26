// ============================================================================
// src/pages/LoginPage.tsx — Login Page Component
// ============================================================================
//
// This page handles user authentication (sign in). It renders a split-screen
// layout with a login form on the left and a hero/marketing panel on the right.
//
// FLOW:
// 1. User enters email + password
// 2. On submit, calls the login() API function
// 3. If successful, stores the JWT token via setAuth() and redirects to /dashboard
// 4. If failed, shows an error toast notification
//
// REACT CONCEPTS:
//   • useState — Manages form field values and loading state
//   • useEffect — Clears any stale token when landing on this page
//   • FormEvent — TypeScript type for the form submission event
//   • Controlled inputs — Input values are tied to React state (not DOM state)
// ============================================================================

import { useEffect, useState, type FormEvent } from "react";
// FormEvent is a TypeScript TYPE import (not runtime code).
// It types the `e` parameter in handleSubmit so you get autocomplete on e.preventDefault(), etc.

import { Link, useNavigate } from "react-router-dom";
// Link — React Router's replacement for <a href="...">. Navigates without full page reload.
// useNavigate — Returns a function to programmatically change the URL.

import { login as apiLogin } from "../api/client";
// `login as apiLogin` renames the imported function to avoid a naming conflict
// with any local variable/function called "login".

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { LogIn } from "lucide-react";  // SVG icon component

export default function LoginPage() {
    // ---- STATE VARIABLES ----
    // useState<type>(initialValue) creates a reactive variable.
    // Returns [currentValue, setterFunction].
    // Calling the setter triggers a re-render with the new value.
    const [email, setEmail] = useState("");        // Email input value
    const [password, setPassword] = useState("");  // Password input value
    const [busy, setBusy] = useState(false);       // True while login request is in-flight

    // ---- HOOKS FROM CONTEXT ----
    const { setAuth, logout } = useAuth();   // setAuth stores token on login; logout clears it
    const { addToast } = useToast();         // Shows popup notifications
    const navigate = useNavigate();          // Function to redirect: navigate("/dashboard")

    // ---- CLEAR STALE TOKEN ON PAGE LOAD ----
    // useEffect with [] dependency runs ONCE when the component first mounts.
    // If the user navigates to /login, we clear any existing session.
    // This prevents issues like a cached invalid token causing silent failures.
    useEffect(() => { logout(); }, []);
    // eslint would warn about missing dependencies (logout), but this is intentional —
    // we only want this to run once.

    // ---- FORM SUBMISSION HANDLER ----
    // Called when the user clicks "Sign In" or presses Enter in the form.
    const handleSubmit = async (e: FormEvent) => {
        // e.preventDefault() stops the browser's default form behaviour.
        // Without this, the browser would do a full page reload (traditional HTML form submit).
        // In React SPAs, we handle form submission entirely in JavaScript.
        e.preventDefault();

        // Client-side validation before making the API call
        if (!email || !password) {
            addToast("Please fill in all fields", "error");
            return;  // Stop here, don't call the API
        }

        setBusy(true);  // Show loading state (disables the button, changes text)
        try {
            // Call the login API endpoint (POST /auth/login)
            const data = await apiLogin(email, password);

            // On success: store the JWT token in AuthContext + localStorage
            // `data.profile as any` is a type cast — the API returns a generic object,
            // but setAuth expects a Profile type. `as any` bypasses the type check.
            setAuth(data.token, data.profile as any);

            // Show success toast and redirect to dashboard
            addToast("Welcome back!", "success");
            navigate("/dashboard");
        } catch (err: any) {
            // `catch (err: any)` catches any error thrown by apiLogin.
            // The `any` type allows accessing err.message without TypeScript errors.
            // In production code, you'd use a proper error type instead of `any`.
            addToast(err?.message || "Login failed — check your credentials", "error");
        } finally {
            // `finally` runs whether the try succeeded or the catch ran.
            // Always re-enable the button after the request completes.
            setBusy(false);
        }
    };

    // ---- JSX (THE UI) ----
    // This returns the HTML-like structure that React renders to the DOM.
    // className is React's version of the HTML `class` attribute
    // (because `class` is a reserved word in JavaScript).
    return (
        <div className="auth-layout">
            {/* LEFT PANEL — Login form */}
            <div className="auth-left">
                {/* Inline style with animation — applies a CSS animation directly */}
                <div className="auth-card" style={{ animation: "fadeIn 0.5s ease" }}>
                    <h1>Welcome back</h1>
                    <p className="subtitle">Sign in to continue building with your team</p>

                    {/* FORM — onSubmit fires when the user submits (Enter key or button click) */}
                    <form className="auth-form" onSubmit={handleSubmit}>
                        {/* ---- EMAIL FIELD ---- */}
                        <div className="form-group">
                            {/* htmlFor links the label to the input (like HTML's `for` attribute) */}
                            <label className="form-label" htmlFor="login-email">Email</label>
                            {/* CONTROLLED INPUT:
                                value={email} — React controls what's displayed
                                onChange={(e) => setEmail(e.target.value)} — updates state on every keystroke
                                This 2-way binding keeps the input value in sync with React state.
                                In vanilla JS, you'd read the value on submit; in React, you track it in real-time. */}
                            <input
                                id="login-email"
                                className="form-input"
                                type="email"
                                placeholder="you@university.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                        {/* ---- PASSWORD FIELD ---- */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="login-password">Password</label>
                            <input
                                id="login-password"
                                className="form-input"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>
                        {/* SUBMIT BUTTON */}
                        {/* disabled={busy} prevents double-clicks while the API call is pending */}
                        <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
                            <LogIn size={18} />
                            {/* Conditional rendering: shows different text based on `busy` state */}
                            {busy ? "Signing in…" : "Sign In"}
                        </button>
                    </form>

                    {/* Link to register page — <Link> is React Router's client-side navigation */}
                    <p className="auth-switch">
                        Don't have an account? <Link to="/register">Create one</Link>
                    </p>
                </div>
            </div>

            {/* RIGHT PANEL — Hero/marketing text */}
            <div className="auth-right">
                <div className="auth-hero-text">
                    <h2>Find Your Perfect Project Buddy</h2>
                    <p>
                        Converge connects you with skilled collaborators. Upload your resume,
                        explore projects, and build something amazing together.
                    </p>
                </div>
            </div>
        </div>
    );
}
