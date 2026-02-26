// ============================================================================
// eslint.config.js — ESLint Configuration (Flat Config Format)
// ============================================================================
//
// WHAT IS ESLINT?
// ESLint is a "linter" — it scans your code for common mistakes, bad patterns,
// and style issues WITHOUT running your code. Think of it as a spell-checker
// for JavaScript/TypeScript.
//
// WHAT IS "FLAT CONFIG"?
// ESLint recently switched from the old .eslintrc format to this new "flat config"
// format. Instead of a JSON file, you export a plain JS array of config objects.
// Each object targets specific files and applies specific rules.
// ============================================================================

import js from '@eslint/js'                       // Core JS linting rules (e.g., no unused vars, no undef)
import globals from 'globals'                     // Lists of global variables (like `window`, `document` for browsers)
import reactHooks from 'eslint-plugin-react-hooks' // Enforces React Hooks rules (e.g., don't call hooks inside if-statements)
import reactRefresh from 'eslint-plugin-react-refresh' // Ensures components work with Vite's Fast Refresh (hot-reload)
import tseslint from 'typescript-eslint'           // TypeScript-specific linting rules
import { defineConfig, globalIgnores } from 'eslint/config' // Helpers for the flat config format

export default defineConfig([
  // Ignore the `dist/` folder — that's the production build output,
  // we don't want to lint generated/bundled code
  globalIgnores(['dist']),

  {
    // Only apply these rules to TypeScript files (.ts and .tsx)
    // .tsx files are TypeScript files that contain JSX (React components)
    files: ['**/*.{ts,tsx}'],

    // `extends` pulls in pre-made rule sets so you don't have to configure
    // hundreds of individual rules yourself:
    extends: [
      js.configs.recommended,                // Basic JS best practices
      tseslint.configs.recommended,          // TypeScript best practices
      reactHooks.configs.flat.recommended,   // React Hooks rules (very important!)
      reactRefresh.configs.vite,             // Vite-specific React refresh rules
    ],

    languageOptions: {
      ecmaVersion: 2020,          // Allow modern JS syntax (optional chaining, nullish coalescing, etc.)
      globals: globals.browser,   // Tell ESLint that browser globals (window, document, fetch) exist
    },
  },
])
