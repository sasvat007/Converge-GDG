// ============================================================================
// src/context/ToastContext.tsx — Toast Notification System
// ============================================================================
//
// WHAT ARE TOASTS?
// Toasts are small popup messages that appear briefly (usually 3-5 seconds)
// to give the user feedback like "Project created successfully!" or "Login failed".
// They're named after how toast pops up from a toaster.
//
// HOW THIS WORKS:
// This file uses the same Context pattern as AuthContext:
//   1. ToastProvider wraps the app (see App.tsx)
//   2. Any component can call addToast("message", "success") to show a toast
//   3. Toasts auto-dismiss after 4 seconds, or can be clicked to dismiss early
//
// USAGE IN OTHER FILES:
//   import { useToast } from "../context/ToastContext";
//   const { addToast } = useToast();
//   addToast("Something happened!", "success");  // or "error" or "info"
// ============================================================================

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
// useCallback — Like useMemo but for functions. Ensures the function reference
//   stays the same across re-renders (prevents unnecessary child re-renders).
//   Without useCallback, a new function object is created on EVERY render.

// ---------------------------------------------------------------------------
// TYPE DEFINITIONS
// ---------------------------------------------------------------------------

// Shape of a single toast notification
interface Toast {
    id: number;                                // Unique ID (for removing specific toasts)
    message: string;                           // The text to display
    type: "success" | "error" | "info";        // Determines the colour/icon
    // This is a UNION TYPE — the value can ONLY be one of these three strings.
    // TypeScript will error if you try type: "warning" (not in the union).
}

// Shape of the context value (what useToast() returns)
interface ToastCtx {
    toasts: Toast[];                                                    // Current list of visible toasts
    addToast: (message: string, type?: "success" | "error" | "info") => void;  // Show a new toast
    removeToast: (id: number) => void;                                  // Dismiss a toast by ID
}

// ---------------------------------------------------------------------------
// CREATE CONTEXT with default values
// ---------------------------------------------------------------------------
const ToastContext = createContext<ToastCtx>({
    toasts: [],
    addToast: () => {},
    removeToast: () => {},
});

// Module-level counter for generating unique toast IDs.
// This lives OUTSIDE the component so it persists across re-renders
// and always increments (never resets to 0).
let toastCounter = 0;

// ============================================================================
// TOAST PROVIDER COMPONENT
// ============================================================================
export function ToastProvider({ children }: { children: ReactNode }) {
    // Array of currently visible toasts
    const [toasts, setToasts] = useState<Toast[]>([]);

    // ---- ADD A TOAST ----
    // useCallback wraps this function so it has a stable identity.
    // The [] dependency array means "never recreate this function".
    const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
        // Toast["type"] is a TypeScript "indexed access type" — it extracts the
        // type of the `type` field from the Toast interface.
        // This is equivalent to writing "success" | "error" | "info".

        const id = ++toastCounter;   // Increment counter and use as unique ID

        // Add the new toast to the end of the array
        // `prev => [...prev, newItem]` is the immutable way to add to an array in React.
        // You can't use .push() because React needs a NEW array reference to detect the change.
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-dismiss after 4 seconds
        // setTimeout schedules the removal function to run after 4000ms
        setTimeout(() => {
            // Remove this specific toast by filtering it out
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    // ---- REMOVE A TOAST (manual dismiss on click) ----
    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        // Provide toast functions to all children
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}

            {/* ================================================================ */}
            {/* TOAST CONTAINER — Renders the actual toast UI                     */}
            {/* ================================================================ */}
            {/* This div is positioned fixed at the bottom-right of the screen   */}
            {/* (styled in App.css with the .toast-container class).             */}
            {/*                                                                  */}
            {/* Unlike traditional HTML where you'd manually create/remove DOM   */}
            {/* elements, React automatically updates the DOM when the `toasts`  */}
            {/* array changes. Add a toast → a new div appears. Remove → it gone.*/}
            <div className="toast-container">
                {/* .map() loops over the toasts array and returns JSX for each one */}
                {/* Every item in a list needs a unique `key` prop so React can     */}
                {/* efficiently track which items changed/added/removed.            */}
                {toasts.map((t) => (
                    <div key={t.id} className={`toast ${t.type}`} onClick={() => removeToast(t.id)}>
                        {/* Conditional rendering with && */}
                        {/* "condition && jsx" renders the jsx ONLY if condition is true */}
                        {t.type === "success" && "✓"}
                        {t.type === "error" && "✕"}
                        {t.type === "info" && "ℹ"}
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

// Custom hook — shortcut for consuming toast functions
export const useToast = () => useContext(ToastContext);
