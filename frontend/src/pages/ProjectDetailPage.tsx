// ============================================================================
// src/pages/ProjectDetailPage.tsx — Single Project Detail View
// ============================================================================

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
    getProjectById,
    completeProject,
    sendTeammateRequest,
    getTeammateSuggestions,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { Project, SuggestedTeammate } from "../types";
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
    Sparkles,
    GraduationCap,
    Building2,
    User,
    Clock,
    X,
    Zap,
} from "lucide-react";

export default function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { profile } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    // ---- STATE ----
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);

    // Suggestions
    const [suggestions, setSuggestions] = useState<SuggestedTeammate[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
    const [invited, setInvited] = useState<Set<string>>(new Set());
    const [invitingEmail, setInvitingEmail] = useState<string | null>(null);

    // Modal
    const [selectedCandidate, setSelectedCandidate] = useState<SuggestedTeammate | null>(null);

    // Ref for scrolling to suggestions
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // ---- FETCH PROJECT DATA ----
    useEffect(() => {
        if (!id) return;
        getProjectById(Number(id))
            .then((p) => setProject(p as unknown as Project))
            .catch(() => addToast("Project not found", "error"))
            .finally(() => setLoading(false));
    }, [id]);

    // ---- LOADING / NOT FOUND ----
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

    // ---- COMPUTED ----
    const isOwner = profile?.email === project.email;
    const skills = project.requiredSkills?.split(",").map((s) => s.trim()).filter(Boolean) || [];
    const tech = project.preferredTechnologies?.split(",").map((s) => s.trim()).filter(Boolean) || [];
    const domains = project.domain?.split(",").map((s) => s.trim()).filter(Boolean) || [];

    // ---- HANDLERS ----
    const handleFindSuggestions = async () => {
        if (!id) return;
        setSuggestionsLoading(true);
        try {
            const data = await getTeammateSuggestions(Number(id));
            const typed = data as unknown as SuggestedTeammate[];
            setSuggestions(typed);
            setSuggestionsLoaded(true);
            if (typed.length === 0) {
                addToast("No matching candidates found right now", "info");
            } else {
                addToast(`Found ${typed.length} matching candidate${typed.length > 1 ? "s" : ""}! 🎯`, "success");
                // Scroll to the suggestions section after a brief delay for render
                setTimeout(() => {
                    suggestionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
            }
        } catch {
            addToast("Could not fetch suggestions — ML service may be unavailable", "error");
            setSuggestionsLoaded(true);
        } finally {
            setSuggestionsLoading(false);
        }
    };

    const handleInviteSuggestion = async (email: string) => {
        if (!id) return;
        setInvitingEmail(email);
        try {
            await sendTeammateRequest(Number(id), email);
            setInvited((prev) => new Set(prev).add(email));
            addToast(`Invitation sent to ${email}!`, "success");
        } catch (err: any) {
            const status = err?.status;
            let msg: string;
            if (status === 404) msg = `User "${email}" not found`;
            else if (status === 409) msg = "Already a teammate on this project";
            else msg = err?.message || "Failed to send invitation";
            addToast(msg, "error");
        } finally {
            setInvitingEmail(null);
        }
    };

    const handleComplete = async () => {
        setCompleting(true);
        try {
            await completeProject(project.id);
            setProject((p) => (p ? { ...p, status: "COMPLETED" } : p));
            addToast("Project marked as completed 🎉", "success");
        } catch (err: any) {
            addToast(err?.message || "Failed to complete project", "error");
        } finally {
            setCompleting(false);
        }
    };

    // ---- Score bar ----
    const ScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
        <div className="suggestion-score-row">
            <span className="suggestion-score-label">{label}</span>
            <div className="suggestion-score-track">
                <div
                    className="suggestion-score-fill"
                    style={{ width: `${Math.round(value * 100)}%`, background: color }}
                />
            </div>
            <span className="suggestion-score-value">{Math.round(value * 100)}%</span>
        </div>
    );

    // ---- JSX ----
    return (
        <div className="page-container">
            {/* BACK */}
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: "1rem" }}>
                <ArrowLeft size={16} /> Back
            </button>

            {/* PROJECT HEADER */}
            <div className="project-detail-header">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                        <h1>{project.title}</h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                            Posted by {project.email}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span className={`badge ${project.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}>
                            {project.status}
                        </span>
                        <span className="badge badge-accent">{project.type}</span>
                        <span className="badge badge-info">
                            {project.visibility === "public" ? <Globe size={12} /> : <Lock size={12} />}
                            <span style={{ marginLeft: 4 }}>{project.visibility}</span>
                        </span>
                    </div>
                </div>
                <div className="project-detail-meta">
                    <div className="project-card-meta">
                        <Calendar size={14} />
                        {new Date(project.createdAt).toLocaleDateString("en-US", {
                            year: "numeric", month: "long", day: "numeric"
                        })}
                    </div>
                    {project.githubRepo && (
                        <a href={project.githubRepo} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                            <GitBranch size={14} /> GitHub <ExternalLink size={12} />
                        </a>
                    )}
                </div>
            </div>

            {/* PROJECT BODY */}
            <div className="project-detail-body">
                {/* LEFT */}
                <div>
                    {project.description && (
                        <div className="profile-section">
                            <h3>📝 Description</h3>
                            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{project.description}</p>
                        </div>
                    )}
                    <div className="profile-section">
                        <h3>🛠 Required Skills</h3>
                        <div className="tag-list">
                            {skills.map((s) => <span key={s} className="tag">{s}</span>)}
                        </div>
                    </div>
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

                {/* RIGHT */}
                <div>
                    {/* TEAM LIST */}
                    <div className="profile-section">
                        <h3><Users size={18} /> Team</h3>
                        {project.teammates && project.teammates.length > 0 ? (
                            <div className="team-list">
                                {project.teammates.map((t) => (
                                    <div key={t.email} className="team-member">
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
                            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No teammates yet</p>
                        )}
                    </div>

                    {/* FIND SUITABLE TEAMMATES — Hero-style CTA */}
                    {isOwner && project.status === "ACTIVE" && !suggestionsLoaded && (
                        <div className="find-teammates-cta">
                            <div className="find-teammates-cta-icon">
                                <Sparkles size={28} />
                            </div>
                            <h3>Find Your Dream Team</h3>
                            <p>Our AI analyzes skills, experience & reliability to suggest the best matches for your project</p>
                            <button
                                className="find-teammates-btn"
                                onClick={handleFindSuggestions}
                                disabled={suggestionsLoading}
                            >
                                {suggestionsLoading ? (
                                    <>
                                        <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                                        Analyzing candidates…
                                    </>
                                ) : (
                                    <>
                                        <Zap size={20} />
                                        Find Suitable Teammates
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Retry if empty */}
                    {isOwner && suggestionsLoaded && suggestions.length === 0 && (
                        <div className="find-teammates-cta" style={{ padding: "1.25rem" }}>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                                No matching candidates found.
                            </p>
                            <button className="btn btn-ghost btn-sm" style={{ marginTop: "0.5rem" }} onClick={handleFindSuggestions}>
                                <Sparkles size={14} /> Try again
                            </button>
                        </div>
                    )}

                    {/* MARK COMPLETE */}
                    {isOwner && project.status === "ACTIVE" && (
                        <div className="profile-section" style={{ marginTop: "1rem" }}>
                            <h3><CheckCircle2 size={18} /> Actions</h3>
                            <button className="btn btn-success" style={{ width: "100%" }} onClick={handleComplete} disabled={completing}>
                                <CheckCircle2 size={16} />
                                {completing ? "Completing…" : "Mark as Completed"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================================= */}
            {/* SUGGESTED TEAMMATES SECTION                                    */}
            {/* ============================================================= */}
            {suggestionsLoaded && suggestions.length > 0 && (
                <div className="suggestions-section" ref={suggestionsRef}>
                    <div className="suggestions-section-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div className="suggestions-header-icon" style={{ width: 44, height: 44 }}>
                                <Sparkles size={22} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: "1.35rem" }}>
                                    Suggested Teammates
                                    <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                                        ({suggestions.length} found)
                                    </span>
                                </h2>
                                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                    Click a candidate to view full details and invite
                                </p>
                            </div>
                        </div>
                        {invited.size > 0 && (
                            <span className="suggestion-invited-badge" style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem" }}>
                                <CheckCircle2 size={14} /> {invited.size} invited
                            </span>
                        )}
                    </div>

                    <div className="suggestions-grid-lg">
                        {suggestions.map((s) => {
                            const isInvitedUser = invited.has(s.email);

                            return (
                                <div
                                    key={s.email}
                                    className={`suggestion-card-lg ${isInvitedUser ? "suggestion-card--invited" : ""}`}
                                    onClick={() => setSelectedCandidate(s)}
                                >
                                    {/* Avatar + name */}
                                    <div className="suggestion-card-header">
                                        <div className="suggestion-avatar-lg">
                                            {s.name?.[0]?.toUpperCase() || s.email[0].toUpperCase()}
                                        </div>
                                        <div className="suggestion-info">
                                            <h3 className="suggestion-name-lg">{s.name || "Unknown"}</h3>
                                            <span className="suggestion-email">{s.email}</span>
                                        </div>
                                        {isInvitedUser && (
                                            <span className="suggestion-invited-badge">
                                                <CheckCircle2 size={14} /> Invited
                                            </span>
                                        )}
                                    </div>

                                    {/* Quick info */}
                                    <div className="suggestion-details">
                                        {s.department && (
                                            <div className="suggestion-detail">
                                                <GraduationCap size={14} /><span>{s.department}</span>
                                            </div>
                                        )}
                                        {s.institution && (
                                            <div className="suggestion-detail">
                                                <Building2 size={14} /><span>{s.institution}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Scores */}
                                    <div className="suggestion-scores">
                                        <ScoreBar label="Match" value={s.finalScore} color="var(--primary, #6366f1)" />
                                        <ScoreBar label="Skills" value={s.capabilityScore} color="var(--success)" />
                                        <ScoreBar label="Trust" value={s.trustScore} color="var(--info)" />
                                    </div>

                                    {/* Click hint */}
                                    <div className="suggestion-card-hint">
                                        Click to view details & invite
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* CANDIDATE DETAIL MODAL                                         */}
            {/* ============================================================= */}
            {selectedCandidate && (
                <div className="modal-backdrop" onClick={() => setSelectedCandidate(null)}>
                    <div className="candidate-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Close button */}
                        <button className="candidate-modal-close" onClick={() => setSelectedCandidate(null)}>
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <div className="candidate-modal-header">
                            <div className="candidate-modal-avatar">
                                {selectedCandidate.name?.[0]?.toUpperCase() || selectedCandidate.email[0].toUpperCase()}
                            </div>
                            <h2>{selectedCandidate.name || "Unknown"}</h2>
                            <p className="candidate-modal-email">{selectedCandidate.email}</p>
                        </div>

                        {/* Scores */}
                        <div className="candidate-modal-scores">
                            <div className="candidate-modal-score-item">
                                <span className="candidate-modal-score-number" style={{ color: "var(--primary, #6366f1)" }}>
                                    {Math.round(selectedCandidate.finalScore * 100)}%
                                </span>
                                <span className="candidate-modal-score-label">Overall Match</span>
                            </div>
                            <div className="candidate-modal-score-item">
                                <span className="candidate-modal-score-number" style={{ color: "var(--success)" }}>
                                    {Math.round(selectedCandidate.capabilityScore * 100)}%
                                </span>
                                <span className="candidate-modal-score-label">Skill Match</span>
                            </div>
                            <div className="candidate-modal-score-item">
                                <span className="candidate-modal-score-number" style={{ color: "var(--info)" }}>
                                    {Math.round(selectedCandidate.trustScore * 100)}%
                                </span>
                                <span className="candidate-modal-score-label">Trust Score</span>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="candidate-modal-details">
                            {selectedCandidate.department && (
                                <div className="candidate-modal-detail-row">
                                    <GraduationCap size={16} />
                                    <div>
                                        <span className="candidate-modal-detail-label">Department</span>
                                        <span className="candidate-modal-detail-value">{selectedCandidate.department}</span>
                                    </div>
                                </div>
                            )}
                            {selectedCandidate.institution && (
                                <div className="candidate-modal-detail-row">
                                    <Building2 size={16} />
                                    <div>
                                        <span className="candidate-modal-detail-label">Institution</span>
                                        <span className="candidate-modal-detail-value">{selectedCandidate.institution}</span>
                                    </div>
                                </div>
                            )}
                            {selectedCandidate.year && (
                                <div className="candidate-modal-detail-row">
                                    <User size={16} />
                                    <div>
                                        <span className="candidate-modal-detail-label">Year</span>
                                        <span className="candidate-modal-detail-value">{selectedCandidate.year}</span>
                                    </div>
                                </div>
                            )}
                            {selectedCandidate.availability && (
                                <div className="candidate-modal-detail-row">
                                    <Clock size={16} />
                                    <div>
                                        <span className="candidate-modal-detail-label">Availability</span>
                                        <span className={`availability-tag availability-${selectedCandidate.availability.toLowerCase()}`}>
                                            {selectedCandidate.availability}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Invite button */}
                        <div className="candidate-modal-actions">
                            {invited.has(selectedCandidate.email) ? (
                                <button className="btn btn-success btn-lg" disabled style={{ width: "100%" }}>
                                    <CheckCircle2 size={18} /> Invitation Sent
                                </button>
                            ) : (
                                <button
                                    className="btn btn-primary btn-lg"
                                    style={{ width: "100%" }}
                                    onClick={() => handleInviteSuggestion(selectedCandidate.email)}
                                    disabled={invitingEmail === selectedCandidate.email}
                                >
                                    {invitingEmail === selectedCandidate.email ? (
                                        "Sending invitation…"
                                    ) : (
                                        <><UserPlus size={18} /> Invite to Project</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
