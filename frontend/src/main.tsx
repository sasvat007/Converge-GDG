// ============================================================================
// main.tsx — The Application Entry Point
// ============================================================================
//
// This is the FIRST JavaScript/TypeScript file that runs when the app loads.
// In index.html, the <script> tag points here: <script src="/src/main.tsx">
//
// WHAT DOES IT DO?
// 1. Finds the <div id="root"> in index.html
// 2. Creates a React "root" (a container React manages)
// 3. Renders the <App /> component inside that root
//
// ANALOGY: If your app were a TV, this file plugs it in and turns it on.
//          The <App /> component is the actual show that plays.
//
// FILE EXTENSION: .tsx means "TypeScript + JSX"
//   - TypeScript = JavaScript with type annotations
//   - JSX = HTML-like syntax inside JavaScript (e.g., <App />, <div>, etc.)
// ============================================================================

// --- IMPORTS ---
// In React, you import specific features you need from libraries.
// This is different from traditional HTML where you load entire script files.

import { StrictMode } from "react";
// StrictMode is a React development helper. It:
//   • Renders every component TWICE (in development only) to catch bugs
//   • Warns about deprecated features and unsafe patterns
//   • Has ZERO performance impact in production builds
//   It does NOT appear in the final HTML — it's purely a development safety net.

import { createRoot } from "react-dom/client";
// createRoot is how React 18+ connects to the real browser DOM.
// "react" handles component logic; "react-dom" handles rendering to the browser.

import "./index.css";
// Imports the global CSS file. In Vite, you can import CSS directly in JS/TS files.
// This CSS applies to the ENTIRE app (global styles, design system variables, etc.)

import App from "./App.tsx";
// Imports the root App component. "./" means "same directory".
// Every React app has one root component that contains everything else.

// --- RENDER THE APP ---
// document.getElementById("root")! finds the <div id="root"> in index.html.
// The "!" at the end is TypeScript's "non-null assertion" — it tells TS:
//   "Trust me, this element exists and is not null."
//   (Without it, TS would complain that getElementById might return null.)
//
// createRoot() creates a React rendering root attached to that div.
// .render() tells React what to display inside it.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
