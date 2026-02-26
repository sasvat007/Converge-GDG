// ============================================================================
// src/pages/ExplorePage.tsx — Explore/Discover Public Projects
// ============================================================================
//
// This page shows ALL public projects from all users (not just your own).
// Users can search by title/description/skills and filter by project type.
//
// PATTERNS IN THIS FILE:
//   • Client-side filtering — Instead of re-fetching from the API with each
//     search/filter change, we load all projects once and filter in JS.
//     This is fine for small datasets but wouldn't scale to millions of records.
//   • Controlled search input — The search query is stored in React state
//   • Filter chips — Buttons that toggle a filter selection
// ============================================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exploreProjects } from "../api/client";
import type { Project } from "../types";
import { Search, Clock, Compass } from "lucide-react";

// ---- CONSTANTS ----
// Project type filter options. Defined outside the component so they're created
// once and reused (not recreated on every render).
const TYPES = ["All", "Software Development", "Research", "Design", "Other"];

export default function ExplorePage() {
    // ---- STATE ----
    const [projects, setProjects] = useState<Project[]>([]);    // All projects from API
    const [loading, setLoading] = useState(true);               // Loading indicator
    const [search, setSearch] = useState("");                   // Search query text
    const [typeFilter, setTypeFilter] = useState("All");        // Active type filter
    const navigate = useNavigate();

    // ---- FETCH ALL PUBLIC PROJECTS ON MOUNT ----
    useEffect(() => {
        exploreProjects()
            .then((p) => setProjects(p as unknown as Project[]))
            .catch(() => { })           // Silently handle errors
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="spinner-overlay">
                <div className="spinner" />
            </div>
        );
    }

    // ---- CLIENT-SIDE FILTERING ----
    // This runs on every render (whenever `search` or `typeFilter` state changes).
    // .filter() returns a NEW array with only the items that pass both conditions.
    const filtered = projects.filter((p) => {
        // Search filter: check if the query appears in title, description, or skills
        // .toLowerCase() makes the search case-insensitive
        // `!search` means "if search is empty, match everything"
        const matchSearch =
            !search ||
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase()) ||
            p.requiredSkills?.toLowerCase().includes(search.toLowerCase());

        // Type filter: "All" matches everything, otherwise must match exactly
        const matchType = typeFilter === "All" || p.type === typeFilter;

        // Both conditions must be true for the project to appear
        return matchSearch && matchType;
    });

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Explore Projects</h1>
                <p>Discover projects that match your skills and interests</p>
            </div>

            {/* ---- SEARCH BAR ---- */}
            {/* The Search icon and input are styled together via the .search-bar class */}
            <div className="search-bar">
                <Search />
                <input
                    id="explore-search"
                    type="text"
                    placeholder="Search by title, description, or skills…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    // Every keystroke updates the `search` state, which triggers a re-render,
                    // which re-runs the filter above, updating the displayed projects instantly.
                />
            </div>

            {/* ---- FILTER CHIPS ---- */}
            {/* A row of buttons. Clicking one sets it as the active filter. */}
            <div className="filter-bar">
                {TYPES.map((t) => (
                    <button
                        key={t}
                        // Dynamic class: adds "active" class to the currently selected filter
                        className={`filter-chip ${typeFilter === t ? "active" : ""}`}
                        onClick={() => setTypeFilter(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* ---- RESULTS ---- */}
            {filtered.length === 0 ? (
                // Empty state when no projects match the search/filter
                <div className="empty-state">
                    <Compass />
                    <h3>No projects found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            ) : (
                // Project cards grid — same pattern as DashboardPage
                <div className="projects-grid">
                    {filtered.map((p, i) => (
                        <div
                            key={p.id}
                            className="project-card"
                            style={{ animationDelay: `${i * 0.06}s` }}
                            onClick={() => navigate(`/projects/${p.id}`)}
                        >
                            <div className="project-card-header">
                                <h3>{p.title}</h3>
                                <span className={`badge ${p.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}>
                                    {p.status}
                                </span>
                            </div>
                            {p.description && (
                                <p className="project-card-desc">{p.description}</p>
                            )}
                            <div className="tag-list">
                                {p.requiredSkills?.split(",").slice(0, 5).map((s) => (
                                    <span key={s} className="tag">{s.trim()}</span>
                                ))}
                            </div>
                            <div className="project-card-footer">
                                <div className="project-card-meta">
                                    <Clock size={14} />
                                    {new Date(p.createdAt).toLocaleDateString()}
                                </div>
                                <div style={{ display: "flex", gap: "0.375rem" }}>
                                    <span className="badge badge-accent">{p.type}</span>
                                    {/* Show domain badge only if the project has a domain */}
                                    {p.domain && (
                                        <span className="badge badge-info">
                                            {p.domain.split(",")[0]}
                                            {/* Show only the first domain if there are multiple */}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
