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

import React, { useEffect, useState, type FormEvent } from "react";
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
    return (
        <div className="auth-layout bg-doodle">
            {/* Background elements (purely decorative) */}
            <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&amp;w=2670&amp;auto=format&amp;fit=crop')] bg-cover bg-center mix-blend-multiply dark:mix-blend-overlay"></div>

            <div className="auth-container">
                <div className="auth-card-inner">
                    {/* LEFT PANEL — Login form */}
                    <div className="auth-left">
                        <div className="auth-card animate-fade-in">
                            <h1>Converge</h1>
                            <p className="subtitle">Where ideas meet collaborators.</p>

                            <form className="auth-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="login-email">Email</label>
                                    <div className="input-icon-wrapper">
                                        <input
                                            id="login-email"
                                            className="form-input"
                                            type="email"
                                            placeholder="student@university.edu"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoComplete="email"
                                        />
                                        <div className="input-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="login-password">Password</label>
                                    <div className="input-icon-wrapper">
                                        <input
                                            id="login-password"
                                            className="form-input"
                                            type="password"
                                            placeholder="Your secret key"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="current-password"
                                        />
                                        <div className="input-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <button className="btn btn-primary" type="submit" disabled={busy}>
                                    <span>{busy ? "Signing in…" : "Join the Lab"}</span>
                                    <LogIn size={20} />
                                </button>
                            </form>

                            <p className="auth-switch">
                                Don't have an account? <Link to="/register">Sign up here</Link>
                            </p>
                        </div>
                    </div>

                    {/* RIGHT PANEL — Marketing / Matchups */}
                    <div className="auth-right">
                        <div className="absolute inset-0 z-0 opacity-[0.08] bg-[url('https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&amp;w=2670&amp;auto=format&amp;fit=crop')] bg-cover bg-center grayscale mix-blend-multiply"></div>
                        <div className="auth-hero-text">
                            <div className="inline-flex items-center justify-center p-3 bg-[var(--bg-card)] rounded-full shadow-lg mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" /><path d="m21 3 1 11h-2" /><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" /><path d="M3 4h8" /></svg>
                            </div>
                            <h2>Latest Matchups</h2>
                            <p>Real-time collaboration activity</p>

                            {/* Ticker Container */}
                            <div className="matchups-container">
                                <div className="matchups-gradient-top"></div>
                                <div className="matchups-gradient-bottom"></div>

                                <div className="animate-scroll-vertical">
                                    {/* Duplicated list for seamless scrolling */}
                                    {[1, 2].map((group) => (
                                        <React.Fragment key={group}>
                                            <div className="matchup-item">
                                                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
                                                <div className="matchup-info">
                                                    <p className="name">Robotics Team</p>
                                                    <p className="time">Matched 2m ago</p>
                                                </div>
                                                <div className="matchup-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                                </div>
                                            </div>
                                            <div className="matchup-item">
                                                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
                                                <div className="matchup-info">
                                                    <p className="name">UX Research</p>
                                                    <p className="time">Matched 5m ago</p>
                                                </div>
                                                <div className="matchup-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                                </div>
                                            </div>
                                            <div className="matchup-item">
                                                <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
                                                <div className="matchup-info">
                                                    <p className="name">BioTech Lab</p>
                                                    <p className="time">Matched 12m ago</p>
                                                </div>
                                                <div className="matchup-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                                </div>
                                            </div>
                                            <div className="matchup-item">
                                                <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
                                                <div className="matchup-info">
                                                    <p className="name">Film Study Group</p>
                                                    <p className="time">Matched 24m ago</p>
                                                </div>
                                                <div className="matchup-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="footer-links">
                    <a href="#">Help Center</a>
                    <div className="footer-dot"></div>
                    <a href="#">Student Guidelines</a>
                    <div className="footer-dot"></div>
                    <a href="#">Privacy</a>
                </div>
            </div>
        </div>
    );
}
