// ============================================================================
// src/pages/ProjectDetailPage.tsx — Single Project Detail View
// ============================================================================
//
// This page shows the full details of one project. It's reached via the URL
// /projects/:id (e.g., /projects/42). The `:id` is a URL parameter that
// React Router extracts with the useParams() hook.
//
// FEATURES:
//   • Display project details (title, description, skills, tech, domains)
//   • Show team members list
//   • Owner-only actions: invite teammates, mark project as completed
//   • Back button using navigate(-1)
//
// REACT CONCEPTS:
//   • useParams — Extracts dynamic URL segments (like :id from /projects/:id)
//   • Functional state update — setProject((p) => p ? {...p, status: "COMPLETED"} : p)
//   • Conditional rendering based on ownership — different UI for owners vs viewers
// ============================================================================

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// useParams — Hook that returns an object of key/value pairs from the URL.
//   For the route `/projects/:id`, visiting `/projects/42` gives { id: "42" }.
//   Note: the value is always a STRING, even if it looks like a number.

import {
    getProjectById,
    completeProject,
    sendTeammateRequest,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { Project } from "../types";
import {
    ArrowLeft,
    ExternalLink,
    Users,
    CheckCircle2,
    UserPlus,
    Calendar,
    GitBranch,
    Globe,
    Lock,
} from "lucide-react";

export default function ProjectDetailPage() {
    // ---- URL PARAMETER ----
    // useParams<{ id: string }>() extracts the :id from the URL.
    // The generic { id: string } tells TypeScript the expected parameter names.
    const { id } = useParams<{ id: string }>();

    const { profile } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    // ---- STATE ----
    const [project, setProject] = useState<Project | null>(null);  // Project data (null until loaded)
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");            // Email for teammate invitation
    const [inviting, setInviting] = useState(false);               // Loading state for invite action
    const [completing, setCompleting] = useState(false);            // Loading state for complete action
    const [showInvite, setShowInvite] = useState(false);           // Toggle invite input visibility

    // ---- FETCH PROJECT DATA ----
    // Runs when the component mounts or when `id` changes.
    useEffect(() => {
        if (!id) return;  // Guard: don't fetch if there's no ID in the URL
        getProjectById(Number(id))
            // Number(id) converts the string "42" to the number 42
            .then((p) => setProject(p as unknown as Project))
            .catch(() => addToast("Project not found", "error"))
            .finally(() => setLoading(false));
    }, [id]);

    // ---- LOADING / NOT FOUND STATES ----
    if (loading) {
        return (
            <div className="spinner-overlay">
                <div className="spinner" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <h3>Project not found</h3>
                    <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ---- COMPUTED VALUES ----
    // Check if the logged-in user is the project owner
    const isOwner = profile?.email === project.email;

    // Parse comma-separated strings into arrays for rendering as tag chips
    // .split(",") → .map(trim) → .filter(Boolean) removes empty strings
    const skills = project.requiredSkills?.split(",").map((s) => s.trim()).filter(Boolean) || [];
    const tech = project.preferredTechnologies?.split(",").map((s) => s.trim()).filter(Boolean) || [];
    const domains = project.domain?.split(",").map((s) => s.trim()).filter(Boolean) || [];

    // ---- INVITE TEAMMATE HANDLER ----
    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        setInviting(true);
        try {
            await sendTeammateRequest(project.id, inviteEmail.trim());
            addToast("Invitation sent!", "success");
            setInviteEmail("");      // Clear the input
            setShowInvite(false);    // Hide the invite form
        } catch (err: any) {
            addToast(err?.message || "Failed to send invitation", "error");
        } finally {
            setInviting(false);
        }
    };

    // ---- MARK COMPLETE HANDLER ----
    const handleComplete = async () => {
        setCompleting(true);
        try {
            await completeProject(project.id);
            // FUNCTIONAL STATE UPDATE:
            // Instead of fetching the entire project again from the API,
            // we update just the status field locally.
            // `(p) => p ? {...p, status: "COMPLETED"} : p` means:
            //   "If p exists, create a copy with status changed. If null, leave as null."
            setProject((p) => (p ? { ...p, status: "COMPLETED" } : p));
            addToast("Project marked as completed 🎉", "success");
        } catch (err: any) {
            addToast(err?.message || "Failed to complete project", "error");
        } finally {
            setCompleting(false);
        }
    };

    // ---- JSX ----
    return (
        <div className="page-container">
            {/* BACK BUTTON — goes to the previous page in browser history */}
            <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate(-1)}
                style={{ marginBottom: "1rem" }}
            >
                <ArrowLeft size={16} /> Back
            </button>

            {/* ============================================================= */}
            {/* PROJECT HEADER — Title, badges, metadata                      */}
            {/* ============================================================= */}
            <div className="project-detail-header">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                        <h1>{project.title}</h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                            Posted by {project.email}
                        </p>
                    </div>
                    {/* STATUS + TYPE + VISIBILITY BADGES */}
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span className={`badge ${project.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}>
                            {project.status}
                        </span>
                        <span className="badge badge-accent">{project.type}</span>
                        <span className="badge badge-info">
                            {/* Render different icon based on visibility */}
                            {project.visibility === "public" ? <Globe size={12} /> : <Lock size={12} />}
                            <span style={{ marginLeft: 4 }}>{project.visibility}</span>
                        </span>
                    </div>
                </div>
                {/* DATE + GITHUB LINK */}
                <div className="project-detail-meta">
                    <div className="project-card-meta">
                        <Calendar size={14} />
                        {new Date(project.createdAt).toLocaleDateString("en-US", {
                            year: "numeric", month: "long", day: "numeric"
                        })}
                    </div>
                    {/* GitHub link — only renders if the project has a repo URL */}
                    {project.githubRepo && (
                        <a
                            href={project.githubRepo}
                            target="_blank"           // Opens in a new tab
                            rel="noopener noreferrer"  // Security best practice for target="_blank"
                            className="btn btn-ghost btn-sm"
                        >
                            <GitBranch size={14} /> GitHub <ExternalLink size={12} />
                        </a>
                    )}
                </div>
            </div>

            {/* ============================================================= */}
            {/* PROJECT BODY — Two-column layout (details + sidebar)          */}
            {/* ============================================================= */}
            <div className="project-detail-body">
                {/* ---- LEFT COLUMN: Description, Skills, Tech, Domains ---- */}
                <div>
                    {project.description && (
                        <div className="profile-section">
                            <h3>📝 Description</h3>
                            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                                {project.description}
                            </p>
                        </div>
                    )}

                    {/* Required Skills Tags */}
                    <div className="profile-section">
                        <h3>🛠 Required Skills</h3>
                        <div className="tag-list">
                            {skills.map((s) => (
                                <span key={s} className="tag">{s}</span>
                            ))}
                        </div>
                    </div>

                    {/* Preferred Technologies Tags (only if present) */}
                    {tech.length > 0 && (
                        <div className="profile-section">
                            <h3>⚡ Preferred Technologies</h3>
                            <div className="tag-list">
                                {tech.map((t) => (
                                    <span key={t} className="tag" style={{ background: "var(--info-bg)", color: "var(--info)", borderColor: "rgba(59,130,246,0.15)" }}>{t}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Domains Tags (only if present) */}
                    {domains.length > 0 && (
                        <div className="profile-section">
                            <h3>🌐 Domains</h3>
                            <div className="tag-list">
                                {domains.map((d) => (
                                    <span key={d} className="tag" style={{ background: "var(--warning-bg)", color: "var(--warning)", borderColor: "rgba(245,158,11,0.15)" }}>{d}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ---- RIGHT COLUMN: Team + Actions (sidebar) ---- */}
                <div>
                    {/* ---- TEAM LIST ---- */}
                    <div className="profile-section">
                        <h3><Users size={18} /> Team</h3>
                        {project.teammates && project.teammates.length > 0 ? (
                            <div className="team-list">
                                {project.teammates.map((t) => (
                                    <div key={t.email} className="team-member">
                                        {/* Avatar with first letter of name or email */}
                                        <div className="team-member-avatar">
                                            {t.name?.[0]?.toUpperCase() || t.email[0].toUpperCase()}
                                        </div>
                                        <div className="team-member-info">
                                            <div className="name">{t.name || t.email}</div>
                                            <div className="detail">
                                                {t.department || ""} {t.year ? `• ${t.year}` : ""}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                No teammates yet
                            </p>
                        )}

                        {/* INVITE TEAMMATE — Only visible to the project owner on active projects */}
                        {isOwner && project.status === "ACTIVE" && (
                            <div style={{ marginTop: "1rem" }}>
                                {!showInvite ? (
                                    // Button to toggle the invite input
                                    <button className="btn btn-secondary btn-sm" onClick={() => setShowInvite(true)} style={{ width: "100%" }}>
                                        <UserPlus size={14} /> Invite Teammate
                                    </button>
                                ) : (
                                    // Invite input + send button
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <input
                                            className="form-input"
                                            placeholder="teammate@email.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                                            // Submit on Enter key
                                            style={{ fontSize: "0.8rem" }}
                                        />
                                        <button className="btn btn-primary btn-sm" onClick={handleInvite} disabled={inviting}>
                                            {inviting ? "…" : "Send"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* MARK AS COMPLETED — Only visible to the owner of active projects */}
                    {isOwner && project.status === "ACTIVE" && (
                        <div className="profile-section" style={{ marginTop: "1rem" }}>
                            <h3><CheckCircle2 size={18} /> Actions</h3>
                            <button
                                className="btn btn-success"
                                style={{ width: "100%" }}
                                onClick={handleComplete}
                                disabled={completing}
                            >
                                <CheckCircle2 size={16} />
                                {completing ? "Completing…" : "Mark as Completed"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
