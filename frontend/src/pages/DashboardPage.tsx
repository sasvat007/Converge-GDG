// ============================================================================
// src/pages/DashboardPage.tsx — User Dashboard (Home Page After Login)
// ============================================================================
//
// The dashboard is the first page users see after logging in. It shows:
//   • A personalised greeting
//   • Stats cards (total projects, active, completed, pending requests)
//   • Quick action buttons (New Project, Explore)
//   • A grid of the user's recent projects
//
// REACT CONCEPTS:
//   • Promise.all — Runs multiple API calls in parallel (faster than sequential)
//   • Array methods — .filter(), .slice(), .map() to transform data for display
//   • Conditional rendering — Show different UI based on data state
//   • animationDelay — Stagger card animations for a polished entrance effect
// ============================================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyProjects, getIncomingRequests } from "../api/client";
import type { Project, TeamRequest } from "../types";
// `type` keyword means we're importing TypeScript types only (no runtime code)

import {
    FolderGit2,
    Users,
    Bell,
    ArrowRight,
    Clock,
    Rocket,
    CheckCircle2,
    Plus,
} from "lucide-react";

export default function DashboardPage() {
    const { profile } = useAuth();     // Current user's profile data
    const navigate = useNavigate();    // Function to navigate to other pages

    // ---- STATE ----
    const [projects, setProjects] = useState<Project[]>([]);       // User's projects
    const [requests, setRequests] = useState<TeamRequest[]>([]);   // Pending team requests
    const [loading, setLoading] = useState(true);                  // Loading indicator

    // ---- FETCH DATA ON MOUNT ----
    // useEffect with [] runs once when the component first renders ("mounts").
    useEffect(() => {
        // Promise.all() runs both API calls SIMULTANEOUSLY (not one after the other).
        // This is faster than calling getMyProjects() and then getIncomingRequests().
        // .catch(() => []) means "if the API fails, return an empty array instead of crashing".
        Promise.all([
            getMyProjects().catch(() => []),
            getIncomingRequests().catch(() => []),
        ]).then(([p, r]) => {
            // [p, r] is DESTRUCTURING — Promise.all returns an array of results.
            // p = projects array, r = requests array (in the same order as the input).

            // Type casting: the API returns generic objects, but we know they match our types
            setProjects(p as unknown as Project[]);

            // Filter requests to only show PENDING ones (not already accepted/rejected)
            setRequests((r as unknown as TeamRequest[]).filter((n) => n.status === "PENDING"));
            setLoading(false);
        });
    }, []);

    // ---- LOADING STATE ----
    // While data is being fetched, show a spinner overlay
    if (loading) {
        return (
            <div className="spinner-overlay">
                <div className="spinner" />
            </div>
        );
    }

    // ---- COMPUTED VALUES ----
    // These are derived from `projects` state — they recalculate on every render.
    // .filter() creates a new array containing only items that match the condition.
    const activeProjects = projects.filter((p) => p.status === "ACTIVE");
    const completedProjects = projects.filter((p) => p.status === "COMPLETED");

    // Time-based greeting function
    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 18) return "Good afternoon";
        return "Good evening";
    };

    // ---- JSX ----
    return (
        <div className="page-container">
            {/* ---- GREETING HEADER ---- */}
            {/* profile?.name?.split(" ")[0] gets the first name (e.g., "John" from "John Doe") */}
            {/* The ?. operator safely handles null — if profile is null, it returns undefined */}
            {/* || "there" provides a fallback: "Good morning, there 👋" */}
            <div className="page-header" style={{ marginBottom: "1.5rem" }}>
                <h1>{greeting()}, {profile?.name?.split(" ")[0] || "there"} 👋</h1>
                <p>Here's what's happening with your projects</p>
            </div>

            {/* ============================================================= */}
            {/* STATS GRID — Four summary cards                               */}
            {/* ============================================================= */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon accent">
                        <FolderGit2 />
                    </div>
                    <div className="stat-content">
                        <h4>{projects.length}</h4>
                        <p>Total Projects</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon success">
                        <Rocket />
                    </div>
                    <div className="stat-content">
                        <h4>{activeProjects.length}</h4>
                        <p>Active</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon info">
                        <CheckCircle2 />
                    </div>
                    <div className="stat-content">
                        <h4>{completedProjects.length}</h4>
                        <p>Completed</p>
                    </div>
                </div>
                {/* Clickable stats card — navigates to notifications on click */}
                <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("/notifications")}>
                    <div className="stat-icon warning">
                        <Bell />
                    </div>
                    <div className="stat-content">
                        <h4>{requests.length}</h4>
                        <p>Pending Requests</p>
                    </div>
                </div>
            </div>

            {/* ============================================================= */}
            {/* QUICK ACTION BUTTONS                                          */}
            {/* ============================================================= */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={() => navigate("/projects/new")}>
                    <Plus size={16} /> New Project
                </button>
                <button className="btn btn-secondary" onClick={() => navigate("/explore")}>
                    <Users size={16} /> Explore Projects
                </button>
            </div>

            {/* ============================================================= */}
            {/* YOUR PROJECTS SECTION                                         */}
            {/* ============================================================= */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 600 }}>Your Projects</h2>
                {/* Conditionally render "View all" button only if there are projects */}
                {projects.length > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate("/explore")}>
                        View all <ArrowRight size={14} />
                    </button>
                )}
            </div>

            {/* ---- CONDITIONAL RENDERING ---- */}
            {/* Ternary operator: condition ? (if true) : (if false) */}
            {/* This is how React handles "if/else" inside JSX */}
            {projects.length === 0 ? (
                // EMPTY STATE — shown when user has no projects
                <div className="empty-state" style={{ padding: "2rem" }}>
                    <FolderGit2 />
                    <h3>No projects yet</h3>
                    <p>Create your first project and start finding collaborators</p>
                    <button className="btn btn-primary" onClick={() => navigate("/projects/new")}>
                        <Plus size={16} /> Create Project
                    </button>
                </div>
            ) : (
                // PROJECT CARDS GRID — show up to 6 projects
                <div className="projects-grid">
                    {/* .slice(0, 6) takes the first 6 projects (pagination) */}
                    {/* .map() converts each project object into a JSX card */}
                    {projects.slice(0, 6).map((p, i) => (
                        <div
                            key={p.id}
                            // key={p.id} — React needs unique keys for list items to track changes
                            className="project-card"
                            // Staggered animation: each card appears slightly after the previous one
                            style={{ animationDelay: `${i * 0.08}s` }}
                            onClick={() => navigate(`/projects/${p.id}`)}
                            // Template literal: `/projects/${p.id}` → "/projects/42"
                        >
                            <div className="project-card-header">
                                <h3>{p.title}</h3>
                                {/* Dynamic CSS class based on status */}
                                <span className={`badge ${p.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}>
                                    {p.status}
                                </span>
                            </div>
                            {/* Short-circuit rendering: p.description && (...) */}
                            {/* Only renders the <p> if description exists (not null/undefined/"") */}
                            {p.description && (
                                <p className="project-card-desc">{p.description}</p>
                            )}
                            {/* Skill tags — split the comma-separated string and render as tags */}
                            <div className="tag-list">
                                {p.requiredSkills?.split(",").slice(0, 4).map((s) => (
                                    <span key={s} className="tag">{s.trim()}</span>
                                ))}
                            </div>
                            <div className="project-card-footer">
                                <div className="project-card-meta">
                                    <Clock size={14} />
                                    {/* Convert ISO date string to a locale-friendly format */}
                                    {new Date(p.createdAt).toLocaleDateString()}
                                </div>
                                <span className="badge badge-accent">{p.type}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
