// ============================================================================
// src/api/client.ts — Centralised API Client for the Converge Backend
// ============================================================================
//
// This file contains ALL the functions that communicate with the backend server.
// Instead of writing fetch() calls scattered across every page component,
// we centralise them here. This way:
//   • Every page imports functions like `login()`, `getMyProjects()`, etc.
//   • If an endpoint URL changes, you update it in ONE place.
//   • Auth headers, error handling, and response parsing are handled consistently.
//
// TYPESCRIPT GENERICS CRASH COURSE:
// You'll see syntax like `handleRes<T>(res)` and `Promise<string>`.
//   • `<T>` is a "generic" — a placeholder for a type that gets filled in later.
//   • `Promise<string>` means "a Promise that resolves to a string".
//   • `handleRes<{ token: string }>` means "parse the response as an object with
//     a token field that's a string".
//   Think of generics like function parameters, but for TYPES instead of values.
//
// ASYNC/AWAIT:
// These functions use `async/await` — you likely know this from JS already.
// `async` makes the function return a Promise; `await` pauses until it resolves.
// ============================================================================

/* ------------------------------------------------------------------ */
/*  Base URL — empty string means "same origin"                        */
/* ------------------------------------------------------------------ */
// Since Vite's proxy (in vite.config.ts) forwards /api and /auth requests
// to the backend, we don't need to specify http://localhost:8080 here.
// An empty string means "use the current domain" (e.g., http://localhost:5173).
const BASE = "";

/* ------------------------------------------------------------------ */
/*  Helper Functions                                                   */
/* ------------------------------------------------------------------ */

/**
 * Builds the HTTP headers needed for authenticated API requests.
 *
 * HOW AUTH WORKS IN THIS APP:
 * 1. User logs in → backend returns a JWT (JSON Web Token) string
 * 2. Frontend stores the token in localStorage (browser key-value storage)
 * 3. For every subsequent API call, we include the token in the
 *    "Authorization" header so the backend knows who's making the request
 *
 * The format "Bearer <token>" is a standard convention (RFC 6750).
 *
 * Record<string, string> is TypeScript for "an object with string keys and string values"
 * — basically the same as { [key: string]: string }
 */
function authHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
}

/**
 * Generic response handler — parses JSON and throws on errors.
 *
 * WHAT THIS DOES:
 * 1. Tries to parse the Response body as JSON
 * 2. If the HTTP status indicates an error (4xx, 5xx), it throws an error
 *    object that our page components can catch and show to the user
 * 3. If everything is OK, returns the parsed data with the correct TypeScript type
 *
 * THE <T> GENERIC:
 * `T` is whatever type the caller expects the response to be.
 * e.g., handleRes<{ token: string }>(res) → returns { token: string }
 * This gives you autocomplete and type-checking in the calling code.
 */
async function handleRes<T>(res: Response): Promise<T> {
    let data: any;
    try {
        data = await res.json(); // Parse the response body as JSON
    } catch {
        // If JSON parsing fails, the server sent a non-JSON response.
        // We still need to handle common HTTP error codes:
        if (res.status === 401) throw { status: 401, message: "Authentication required — please log in" };
        if (res.status === 403) throw { status: 403, message: "Session expired — please log in again" };
        if (!res.ok) throw { status: res.status, message: `Server error (${res.status})` };
        throw { status: res.status, message: "Invalid response from server" };
    }
    // If the HTTP status is not 2xx (success), throw the error data from the backend
    if (!res.ok) throw { status: res.status, ...data };
    // Success — cast the data to the expected type T and return it
    return data as T;
}

/**
 * Converts a File object (from an <input type="file">) to a Base64-encoded string.
 *
 * WHY BASE64?
 * The backend expects the resume PDF as a base64 string in the JSON body
 * (not as a multipart form upload). Base64 encodes binary data (like a PDF)
 * into text characters that can be safely embedded in JSON.
 *
 * HOW IT WORKS:
 * 1. FileReader reads the file as a "data URL" (e.g., "data:application/pdf;base64,ABC...")
 * 2. We split on the comma to extract just the base64 part ("ABC...")
 * 3. We return that base64 string
 *
 * `export` makes this function importable by other files (used in RegisterPage).
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // Strip the "data:...;base64," prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/* ================================================================== */
/*  AUTH ENDPOINTS                                                     */
/* ================================================================== */
// These endpoints do NOT require an auth token (the user isn't logged in yet).

/**
 * POST /auth/register
 * Creates a new user account. Sends profile details + resume text to the backend.
 * The backend parses the resume with AI and returns a JWT token.
 *
 * @param body - Registration form data
 * @returns { token, message, profile? } — the JWT token to store for future requests
 */
export async function register(body: {
    email: string;
    password: string;
    resumeText: string;
    resumePdf?: string | null;  // Optional base64-encoded PDF
    name?: string;
    year?: string;
    department?: string;
    institution?: string;
    availability?: string;
}) {
    const res = await fetch(`${BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),  // Convert JS object to JSON string
    });
    return handleRes<{ token: string; message: string; profile?: Record<string, unknown> }>(res);
}

/**
 * POST /auth/login
 * Authenticates an existing user with email + password.
 *
 * @returns { token, profile? } — JWT token for authenticated requests
 */
export async function login(email: string, password: string) {
    const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return handleRes<{ token: string; profile?: Record<string, unknown> }>(res);
}

/* ================================================================== */
/*  PROFILE & RESUME ENDPOINTS (require auth token)                   */
/* ================================================================== */

/**
 * GET /api/profile
 * Fetches the currently logged-in user's profile.
 * The backend identifies the user from the JWT token in the Authorization header.
 */
export async function getMyProfile() {
    const res = await fetch(`${BASE}/api/profile`, { headers: authHeaders() });
    return handleRes<Record<string, unknown>>(res);
}

/**
 * GET /api/profile/:id
 * Fetches another user's profile by their numeric ID.
 */
export async function getProfileById(id: number) {
    const res = await fetch(`${BASE}/api/profile/${id}`, { headers: authHeaders() });
    return handleRes<Record<string, unknown>>(res);
}

/**
 * POST /api/upload
 * Uploads a resume (used during registration or profile update).
 */
export async function uploadResume(body: Record<string, unknown>) {
    const res = await fetch(`${BASE}/api/upload`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    return handleRes<Record<string, unknown>>(res);
}

/**
 * PUT /api/resume/update
 * Updates the current user's resume (text and/or PDF).
 */
export async function updateResume(body: { resumeText?: string; resumePdf?: string }) {
    const res = await fetch(`${BASE}/api/resume/update`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    return handleRes<{ message: string; profile: Record<string, unknown> }>(res);
}

/**
 * Returns the URL to download a user's resume PDF.
 * This is NOT a fetch call — it returns a URL string that can be used
 * as an <a href="..."> link or opened in a new tab.
 */
export function resumeDownloadUrl(id: number) {
    return `${BASE}/api/resume/download/${id}`;
}

/* ================================================================== */
/*  PROJECT ENDPOINTS (require auth token)                            */
/* ================================================================== */

/**
 * POST /api/projects
 * Creates a new project. The logged-in user becomes the project owner.
 *
 * @param body - Project details (title, type, skills, etc.)
 * @returns The created project object (including its new `id`)
 */
export async function createProject(body: {
    title: string;
    type: string;
    visibility: string;
    requiredSkills: string[];
    preferredTechnologies?: string[];
    domain?: string[];
    githubRepo?: string;
    description?: string;
}) {
    const res = await fetch(`${BASE}/api/projects`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    return handleRes<Record<string, unknown>>(res);
}

/**
 * GET /api/projects
 * Fetches all projects owned by or involving the current user.
 * Used on the Dashboard to show "Your Projects".
 */
export async function getMyProjects() {
    const res = await fetch(`${BASE}/api/projects`, { headers: authHeaders() });
    return handleRes<Record<string, unknown>[]>(res);
    // Record<string, unknown>[] means "an array of objects with any string keys"
}

/**
 * GET /api/projects/explore
 * Fetches all PUBLIC projects (for the Explore page).
 * Shows projects from ALL users, not just the current user.
 */
export async function exploreProjects() {
    const res = await fetch(`${BASE}/api/projects/explore`, { headers: authHeaders() });
    return handleRes<Record<string, unknown>[]>(res);
}

/**
 * GET /api/projects/:id
 * Fetches a single project by its numeric ID.
 * Includes full details: description, teammates, skills, etc.
 */
export async function getProjectById(id: number) {
    const res = await fetch(`${BASE}/api/projects/${id}`, { headers: authHeaders() });
    return handleRes<Record<string, unknown>>(res);
}

/**
 * POST /api/projects/:id/complete
 * Marks a project as "COMPLETED". Only the project owner can do this.
 */
export async function completeProject(id: number) {
    const res = await fetch(`${BASE}/api/projects/${id}/complete`, {
        method: "POST",
        headers: authHeaders(),
    });
    return handleRes<Record<string, unknown>>(res);
}

/* ================================================================== */
/*  TEAM MANAGEMENT ENDPOINTS (require auth token)                    */
/* ================================================================== */

/**
 * POST /api/projects/:projectId/teammates
 * Sends a teammate invitation to another user (by email).
 * Creates a "JOIN_REQUEST" that appears in the target user's notifications.
 */
export async function sendTeammateRequest(projectId: number, email: string) {
    const res = await fetch(`${BASE}/api/projects/${projectId}/teammates`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email }),
    });
    return handleRes<Record<string, unknown>>(res);
}

/**
 * GET /api/projects/teammates/requests
 * Fetches all incoming teammate/rating requests for the current user.
 * Used on the Notifications page and for the sidebar badge count.
 */
export async function getIncomingRequests() {
    const res = await fetch(`${BASE}/api/projects/teammates/requests`, {
        headers: authHeaders(),
    });
    return handleRes<Record<string, unknown>[]>(res);
}

/**
 * POST /api/projects/teammates/requests/:requestId/accept
 * Accepts a pending teammate request. The requester is added to the project team.
 */
export async function acceptRequest(requestId: number) {
    const res = await fetch(`${BASE}/api/projects/teammates/requests/${requestId}/accept`, {
        method: "POST",
        headers: authHeaders(),
    });
    return handleRes<Record<string, unknown>>(res);
}

/**
 * POST /api/projects/teammates/requests/:requestId/reject
 * Rejects a pending teammate request.
 */
export async function rejectRequest(requestId: number) {
    const res = await fetch(`${BASE}/api/projects/teammates/requests/${requestId}/reject`, {
        method: "POST",
        headers: authHeaders(),
    });
    return handleRes<Record<string, unknown>>(res);
}
