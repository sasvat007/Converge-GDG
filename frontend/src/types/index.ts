// ============================================================================
// src/types/index.ts — Shared TypeScript Type Definitions
// ============================================================================
//
// WHAT ARE TYPES / INTERFACES?
// In plain JavaScript, objects can have any shape — you might accidentally
// access `user.namee` (typo) and get `undefined` with no warning.
//
// TypeScript interfaces define the SHAPE of an object:
//   interface User { name: string; age: number; }
// Now if you try `user.namee`, TypeScript shows an error BEFORE you run the code.
//
// WHY A SEPARATE TYPES FILE?
// These types are used across multiple files (pages, API client, contexts).
// Putting them here avoids duplication and keeps all data shapes in one place.
//
// COMMON TYPESCRIPT SYNTAX:
//   • `string | null` — the value can be a string OR null (called a "union type")
//   • `field?: string` — the "?" makes the field optional (may or may not exist)
//   • `string[]`       — an array of strings
//   • `Record<string, string>` — an object with string keys and string values
//   • `export`         — makes the type importable by other files
// ============================================================================

/* ------------------------------------------------------------------ */
/*  Profile — Represents a user's profile data                         */
/* ------------------------------------------------------------------ */
// This maps to the JSON response from GET /api/profile.
// The backend returns fields like email, name, year, department, etc.
export interface Profile {
    id?: number;                    // User's numeric ID (optional because it might not be in every response)
    email: string;                  // User's email address (always present)
    name: string | null;            // Display name (null if not set during registration)
    year: string | null;            // Academic year (e.g., "2nd Year", null if not set)
    department: string | null;      // Department (e.g., "Computer Science")
    institution: string | null;     // University/institution name
    availability: string | null;    // "low" | "medium" | "high" — how available for projects
    resumePdfUrl?: string | null;   // URL to download the user's resume PDF
    Resume?: string;                // Raw JSON string from backend — contains AI-parsed resume data
                                    // This gets JSON.parse()'d into a ParsedResume object (see below)
}

/* ------------------------------------------------------------------ */
/*  ParsedResume — Structured resume data extracted by AI              */
/* ------------------------------------------------------------------ */
// When a user uploads their resume text, the backend uses AI to parse it
// into this structured format. It's stored as a JSON string in Profile.Resume
// and parsed on the frontend (see ProfilePage.tsx).
//
// Every field is optional because the AI might not extract all sections.
export interface ParsedResume {
    profile?: {
        name?: string;
        year?: string;
        department?: string;
        availability?: string;
    };
    skills?: {
        programming_languages?: string[];     // e.g., ["Python", "JavaScript", "Go"]
        frameworks_libraries?: string[];      // e.g., ["React", "Express", "Django"]
        tools_platforms?: string[];            // e.g., ["Docker", "AWS", "Git"]
        core_cs_concepts?: string[];           // e.g., ["Data Structures", "Algorithms"]
        domain_skills?: string[];              // e.g., ["Machine Learning", "Web Dev"]
    };
    experience_level?: {
        overall?: string;                      // e.g., "Intermediate"
        by_domain?: Record<string, string>;    // e.g., { "Web Dev": "Advanced", "ML": "Beginner" }
    };
    projects?: {                               // Array of past projects
        title?: string;
        description?: string;
        technologies?: string[];
        domain?: string;
        role?: string;
        completion_status?: string;
    }[];                                       // The [] after the } means "array of these objects"
    interests?: {
        technical?: string[];                  // e.g., ["Cloud Computing", "DevOps"]
        problem_domains?: string[];            // e.g., ["Healthcare", "Education"]
        learning_goals?: string[];             // e.g., ["Learn Rust", "Contribute to OSS"]
    };
    achievements?: {
        hackathons?: string[];                 // e.g., ["Won HackMIT 2024"]
        certifications?: string[];             // e.g., ["AWS Solutions Architect"]
        awards?: string[];                     // e.g., ["Dean's List"]
    };
}

/* ------------------------------------------------------------------ */
/*  Project — Represents a project listing                             */
/* ------------------------------------------------------------------ */
// Maps to the JSON response from GET /api/projects and GET /api/projects/:id
export interface Project {
    id: number;                     // Unique project ID
    title: string;                  // Project name
    type: string;                   // "Software Development" | "Research" | "Design" | etc.
    visibility: string;             // "public" | "private"
    requiredSkills: string;         // Comma-separated string of skills (e.g., "React,Python,Docker")
                                    // NOTE: stored as a string, not an array — needs .split(",") to use
    preferredTechnologies?: string; // Optional comma-separated tech stack
    githubRepo?: string;            // Optional GitHub URL
    description?: string;           // Optional project description
    domain?: string;                // Optional comma-separated domains (e.g., "AI/ML,Web Dev")
    createdAt: string;              // ISO date string (e.g., "2024-01-15T10:30:00Z")
    email: string;                  // Email of the project owner/creator
    status: string;                 // "ACTIVE" | "COMPLETED"
    postedBy?: { email: string };   // Alternative way the owner info might appear
    teammates?: Teammate[];          // Array of team members (see below)
}

/* ------------------------------------------------------------------ */
/*  Teammate — A team member on a project                              */
/* ------------------------------------------------------------------ */
export interface Teammate {
    id?: number;
    email: string;
    name: string | null;
    year?: string | null;
    department?: string | null;
    institution?: string | null;
    availability?: string | null;
    addedAt?: string;               // When they joined the project
}

/* ------------------------------------------------------------------ */
/*  TeamRequest — A pending invitation or rating request               */
/* ------------------------------------------------------------------ */
// These appear on the Notifications page. Two types:
//   • JOIN_REQUEST — Someone invited you to join their project
//   • RATING_REQUEST — You're asked to rate a teammate after project completion
export interface TeamRequest {
    requestId: number;              // Unique request ID (used to accept/reject)
    projectId: number;              // Which project this request is about
    projectTitle?: string;          // Human-readable project name
    requesterEmail: string;         // Who sent the request
    targetEmail: string;            // Who the request is sent to (you)
    status: string;                 // "PENDING" | "ACCEPTED" | "REJECTED"
    type: string;                   // "JOIN_REQUEST" | "RATING_REQUEST"
    rateeEmail?: string | null;     // For RATING_REQUEST: who to rate
    rateeName?: string | null;      // For RATING_REQUEST: name of person to rate
    createdAt: string;              // When the request was created
    updatedAt?: string;             // When the request was last updated
}

/* ------------------------------------------------------------------ */
/*  ApiError — Standard error response shape from the backend          */
/* ------------------------------------------------------------------ */
// When the backend returns an error (4xx or 5xx), it sends JSON in this shape.
// The API client (client.ts) throws these as exceptions that page components catch.
export interface ApiError {
    timestamp: string;              // When the error occurred
    status: number;                 // HTTP status code (400, 401, 404, 500, etc.)
    error: string;                  // Short error name (e.g., "Not Found", "Unauthorized")
    message: string;                // Human-readable error message
}
