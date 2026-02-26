// ============================================================================
// src/pages/ProfilePage.tsx — User Profile / AI-Parsed Resume Display
// ============================================================================
//
// This page shows the logged-in user's profile and their AI-parsed resume data.
// The resume is stored as a JSON string in the Profile.Resume field. When this
// page loads, it JSON.parse()'s that string into a structured ParsedResume object
// and renders each section (skills, interests, projects, achievements).
//
// REACT CONCEPTS:
//   • JSON.parse for structured data — The backend stores the AI-parsed resume
//     as a JSON string. We parse it on the frontend to render it as structured UI.
//   • Inline component (Section) — A small helper component defined INSIDE the
//     main component. This is fine for simple, non-reusable helpers.
//   • Grid layout via inline styles — CSS Grid for 2-column layout
// ============================================================================

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { resumeDownloadUrl } from "../api/client";
import type { ParsedResume } from "../types";
import {
    GraduationCap, Building2, Clock, Download, Code,
    Lightbulb, Trophy, Briefcase, Target,
} from "lucide-react";

export default function ProfilePage() {
    const { profile } = useAuth();     // Current user's profile from AuthContext
    const { addToast } = useToast();

    // Parsed resume data — starts as null, populated from profile.Resume JSON string
    const [resume, setResume] = useState<ParsedResume | null>(null);

    // ---- PARSE RESUME DATA ----
    // When `profile` changes (or on first render), try to parse the Resume JSON string.
    // profile.Resume is a raw JSON string like '{"skills":{"programming_languages":["Python"]}}'
    // JSON.parse converts it into a JavaScript object matching the ParsedResume interface.
    useEffect(() => {
        if (profile?.Resume) {
            try {
                setResume(JSON.parse(profile.Resume));
            } catch {
                // JSON.parse can throw if the string is malformed
                addToast("Could not parse resume data", "error");
            }
        }
    }, [profile]);

    // Show spinner if profile hasn't loaded yet
    if (!profile) return <div className="spinner-overlay"><div className="spinner" /></div>;

    // ---- COMPUTE INITIALS for the avatar ----
    const initials = profile.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

    // ---- INLINE HELPER COMPONENT ----
    // This is a small component defined INSIDE ProfilePage. It's used to render
    // each resume section with a consistent title + icon format.
    //
    // The parameter type `{ title: string; icon: React.ReactNode; children: React.ReactNode }`
    // is an inline TypeScript interface:
    //   • title: string — The section heading text
    //   • icon: React.ReactNode — A React element (the Lucide icon component)
    //   • children: React.ReactNode — Whatever JSX is nested inside <Section>...</Section>
    //
    // This is NOT a full component (not exported, not in its own file). It's a
    // simple helper that avoids repeating the section wrapper HTML.
    const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
        <div className="profile-section">
            <h3>{icon} {title}</h3>
            {children}
        </div>
    );

    return (
        <div className="page-container">
            <div className="page-header"><h1>My Profile</h1></div>

            {/* ============================================================= */}
            {/* HERO SECTION — Avatar, name, email, metadata, download link   */}
            {/* ============================================================= */}
            <div className="profile-hero">
                {/* Large avatar circle with initials */}
                <div className="profile-avatar-lg">{initials}</div>
                <div className="profile-info">
                    <h2>{profile.name || "Unknown"}</h2>
                    <p className="email">{profile.email}</p>

                    {/* Metadata chips — only render if the field has a value */}
                    <div className="profile-meta">
                        {profile.department && <span className="profile-meta-item"><GraduationCap size={14} />{profile.department}</span>}
                        {profile.year && <span className="profile-meta-item"><Clock size={14} />{profile.year}</span>}
                        {profile.institution && <span className="profile-meta-item"><Building2 size={14} />{profile.institution}</span>}
                        {/* Availability badge — different colour based on level */}
                        {profile.availability && (
                            <span className={`badge ${profile.availability === "high" ? "badge-success" : profile.availability === "medium" ? "badge-warning" : "badge-danger"}`}>
                                {profile.availability} availability
                            </span>
                        )}
                    </div>

                    {/* Download resume link — opens in a new tab */}
                    {/* resumeDownloadUrl(id) returns a URL string like "/api/resume/download/42" */}
                    {profile.id && (
                        <a href={resumeDownloadUrl(profile.id)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: "0.75rem" }}>
                            <Download size={14} /> Download Resume
                        </a>
                    )}
                </div>
            </div>

            {/* ============================================================= */}
            {/* RESUME SECTIONS — Rendered from the parsed JSON data          */}
            {/* ============================================================= */}
            {/* Only render if resume data was successfully parsed */}
            {resume && (
                // CSS Grid: 2-column layout for the resume sections
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

                    {/* ---- SKILLS SECTION ---- */}
                    {resume.skills && (
                        <Section title="Skills" icon={<Code size={18} />}>
                            {/* Each skill category is rendered as a sub-section with tag chips */}
                            {/* The pattern: check if array exists and has items → render it */}
                            {resume.skills.programming_languages?.length ? (
                                <div style={{ marginBottom: "0.75rem" }}>
                                    <p className="form-label" style={{ marginBottom: "0.375rem" }}>Languages</p>
                                    <div className="tag-list">{resume.skills.programming_languages.map((s) => <span key={s} className="tag">{s}</span>)}</div>
                                </div>
                            ) : null}
                            {/* `? (...) : null` is a ternary that renders nothing (null) if the array is empty */}
                            {resume.skills.frameworks_libraries?.length ? (
                                <div style={{ marginBottom: "0.75rem" }}>
                                    <p className="form-label" style={{ marginBottom: "0.375rem" }}>Frameworks</p>
                                    <div className="tag-list">{resume.skills.frameworks_libraries.map((s) => <span key={s} className="tag">{s}</span>)}</div>
                                </div>
                            ) : null}
                            {resume.skills.tools_platforms?.length ? (
                                <div>
                                    <p className="form-label" style={{ marginBottom: "0.375rem" }}>Tools</p>
                                    <div className="tag-list">{resume.skills.tools_platforms.map((s) => <span key={s} className="tag">{s}</span>)}</div>
                                </div>
                            ) : null}
                        </Section>
                    )}

                    {/* ---- INTERESTS SECTION ---- */}
                    {resume.interests && (
                        <Section title="Interests" icon={<Lightbulb size={18} />}>
                            {resume.interests.technical?.length ? (
                                <div style={{ marginBottom: "0.75rem" }}>
                                    <p className="form-label" style={{ marginBottom: "0.375rem" }}>Technical</p>
                                    <div className="tag-list">{resume.interests.technical.map((s) => <span key={s} className="tag">{s}</span>)}</div>
                                </div>
                            ) : null}
                            {resume.interests.learning_goals?.length ? (
                                <div>
                                    <p className="form-label" style={{ marginBottom: "0.375rem" }}>Learning Goals</p>
                                    <div className="tag-list">{resume.interests.learning_goals.map((s) => <span key={s} className="tag">{s}</span>)}</div>
                                </div>
                            ) : null}
                        </Section>
                    )}

                    {/* ---- PAST PROJECTS SECTION ---- */}
                    {resume.projects && resume.projects.length > 0 && (
                        <Section title="Past Projects" icon={<Briefcase size={18} />}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {/* .slice(0, 5) limits to the first 5 projects */}
                                {resume.projects.slice(0, 5).map((p, i) => (
                                    // `key={i}` — Using index as key is OK here because the list
                                    // is static (not reordered or edited). For dynamic lists, use a unique ID.
                                    <div key={i} style={{ padding: "0.75rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)" }}>
                                        <p style={{ fontWeight: 600, fontSize: "0.85rem" }}>{p.title}</p>
                                        {p.description && <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{p.description}</p>}
                                        {p.technologies?.length ? <div className="tag-list" style={{ marginTop: "0.375rem" }}>{p.technologies.map((t) => <span key={t} className="tag">{t}</span>)}</div> : null}
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* ---- ACHIEVEMENTS SECTION ---- */}
                    {resume.achievements && (
                        <Section title="Achievements" icon={<Trophy size={18} />}>
                            {resume.achievements.hackathons?.length ? (
                                <div style={{ marginBottom: "0.75rem" }}>
                                    <p className="form-label" style={{ marginBottom: "0.375rem" }}>Hackathons</p>
                                    <ul style={{ paddingLeft: "1.25rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                        {resume.achievements.hackathons.map((h) => <li key={h}>{h}</li>)}
                                    </ul>
                                </div>
                            ) : null}
                            {resume.achievements.certifications?.length ? (
                                <div>
                                    <p className="form-label" style={{ marginBottom: "0.375rem" }}>Certifications</p>
                                    <div className="tag-list">{resume.achievements.certifications.map((c) => <span key={c} className="tag">{c}</span>)}</div>
                                </div>
                            ) : null}
                        </Section>
                    )}
                </div>
            )}

            {/* ---- EMPTY STATE — shown if no resume data exists ---- */}
            {!resume && (
                <div className="empty-state">
                    <Target />
                    <h3>No resume data yet</h3>
                    <p>Your AI-parsed resume data will appear here after you upload a resume</p>
                </div>
            )}
        </div>
    );
}
