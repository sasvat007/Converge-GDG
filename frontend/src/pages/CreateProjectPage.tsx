// ============================================================================
// src/pages/CreateProjectPage.tsx — Create New Project Form
// ============================================================================
//
// This page lets users create a new project by filling out a form with:
//   • Title, type, visibility, description (simple fields)
//   • Required skills, preferred technologies, domains (TAG INPUTS — see below)
//   • GitHub repository URL
//
// TAG INPUT PATTERN:
// For skills, tech, and domains, we use a "tag input" — an input where pressing
// Enter or comma adds the text as a tag chip. Tags can be removed by clicking X.
// This is a common UI pattern (think Gmail's "To" field with email chips).
//
// The tags are stored as string arrays (string[]), not comma-separated strings.
// The backend receives the array and stores it.
//
// REACT CONCEPTS:
//   • KeyboardEvent handling — Detecting Enter/Comma/Backspace keys
//   • Array state manipulation — Adding/removing items immutably
//   • Reusable handler function — One function handles all three tag inputs
// ============================================================================

import { useState, type FormEvent, type KeyboardEvent } from "react";
// KeyboardEvent — TypeScript type for keyboard events. The generic <HTMLInputElement>
// specifies which DOM element type this event comes from.

import { useNavigate } from "react-router-dom";
import { createProject } from "../api/client";
import { useToast } from "../context/ToastContext";
import { FolderPlus, X } from "lucide-react";

export default function CreateProjectPage() {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);

    // ---- FORM STATE ----
    // Simple text fields stored as a single object
    const [form, setForm] = useState({
        title: "",
        type: "Software Development",  // Default selection
        visibility: "public",          // Default selection
        description: "",
        githubRepo: "",
    });

    // ---- TAG STATE ----
    // Each tag field has TWO states:
    //   1. The array of confirmed tags (e.g., ["React", "Python"])
    //   2. The current text in the input (the tag being typed)
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState("");
    const [techStack, setTechStack] = useState<string[]>([]);
    const [techInput, setTechInput] = useState("");
    const [domains, setDomains] = useState<string[]>([]);
    const [domainInput, setDomainInput] = useState("");

    // Helper to update a single form field (same pattern as RegisterPage)
    const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

    // ---- TAG INPUT KEY HANDLER ----
    // This is a REUSABLE function that handles keyboard events for ALL three tag inputs.
    // It accepts the current tags array, setter, input text, and input setter as parameters.
    // This avoids duplicating the same logic three times.
    const handleTagKeyDown = (
        e: KeyboardEvent<HTMLInputElement>,  // The keyboard event from the input
        tags: string[],                      // Current tags array
        setTags: (t: string[]) => void,      // Function to update tags
        input: string,                       // Current input text
        setInput: (v: string) => void        // Function to update input text
    ) => {
        // ---- ADD TAG on Enter or Comma ----
        if ((e.key === "Enter" || e.key === ",") && input.trim()) {
            e.preventDefault();  // Prevent form submission on Enter
            const val = input.trim().replace(/,$/, "");  // Remove trailing comma
            if (val && !tags.includes(val)) {
                // Only add if not empty and not a duplicate
                setTags([...tags, val]);
                // [...tags, val] creates a new array with all existing tags + the new one
                // We can't use .push() because React needs a new array reference
            }
            setInput("");  // Clear the input for the next tag
        }

        // ---- REMOVE LAST TAG on Backspace (when input is empty) ----
        if (e.key === "Backspace" && !input && tags.length > 0) {
            setTags(tags.slice(0, -1));
            // .slice(0, -1) returns all elements except the last one
        }
    };

    // ---- FORM SUBMISSION ----
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Validation
        if (!form.title.trim()) {
            addToast("Project title is required", "error");
            return;
        }
        if (skills.length === 0) {
            addToast("Add at least one required skill", "error");
            return;
        }

        setBusy(true);
        try {
            const res = await createProject({
                ...form,                    // Spread all simple form fields
                requiredSkills: skills,     // Send skills as an array
                // `undefined` fields are excluded from JSON — the backend ignores them
                preferredTechnologies: techStack.length ? techStack : undefined,
                domain: domains.length ? domains : undefined,
            });

            addToast("Project created successfully! 🚀", "success");
            // Navigate to the newly created project's detail page
            // `(res as any).id` extracts the new project's ID from the response
            navigate(`/projects/${(res as any).id}`);
        } catch (err: any) {
            addToast(err?.message || "Failed to create project", "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Create New Project</h1>
                <p>Describe your project and find the right teammates</p>
            </div>

            <form className="create-project-form" onSubmit={handleSubmit}>
                {/* ---- Title ---- */}
                <div className="form-group">
                    <label className="form-label" htmlFor="proj-title">Project Title *</label>
                    <input
                        id="proj-title"
                        className="form-input"
                        placeholder="AI Chatbot Platform"
                        value={form.title}
                        onChange={(e) => set("title", e.target.value)}
                        required
                    />
                </div>

                {/* ---- Type + Visibility (side by side) ---- */}
                {/* Inline styles for a 2-column grid layout */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="proj-type">Type *</label>
                        <select
                            id="proj-type"
                            className="form-select"
                            value={form.type}
                            onChange={(e) => set("type", e.target.value)}
                        >
                            <option value="Software Development">Software Development</option>
                            <option value="Research">Research</option>
                            <option value="Design">Design</option>
                            <option value="Data Science">Data Science</option>
                            <option value="Mobile App">Mobile App</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="proj-visibility">Visibility *</label>
                        <select
                            id="proj-visibility"
                            className="form-select"
                            value={form.visibility}
                            onChange={(e) => set("visibility", e.target.value)}
                        >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                </div>

                {/* ---- Description ---- */}
                <div className="form-group">
                    <label className="form-label" htmlFor="proj-desc">Description</label>
                    <textarea
                        id="proj-desc"
                        className="form-textarea"
                        placeholder="Describe your project, its goals, and what you're looking for in collaborators…"
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        rows={4}
                    />
                </div>

                {/* ============================================================= */}
                {/* TAG INPUT: Required Skills                                    */}
                {/* ============================================================= */}
                {/* The tag-input-container renders existing tags + an input field */}
                <div className="form-group">
                    <label className="form-label">Required Skills *</label>
                    <div className="tag-input-container">
                        {/* Render each existing skill as a removable tag chip */}
                        {skills.map((s) => (
                            <span key={s} className="tag">
                                {s}
                                {/* X button removes this specific tag */}
                                {/* type="button" prevents the button from submitting the form */}
                                <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}>
                                    {/* .filter((x) => x !== s) creates a new array without this tag */}
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        {/* Input for typing new tags */}
                        <input
                            placeholder={skills.length ? "" : "Type and press Enter…"}
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => handleTagKeyDown(e, skills, setSkills, skillInput, setSkillInput)}
                        />
                    </div>
                    <span className="form-hint">Press Enter or comma to add</span>
                </div>

                {/* ---- TAG INPUT: Preferred Technologies ---- */}
                <div className="form-group">
                    <label className="form-label">Preferred Technologies</label>
                    <div className="tag-input-container">
                        {techStack.map((t) => (
                            <span key={t} className="tag">
                                {t}
                                <button type="button" onClick={() => setTechStack(techStack.filter((x) => x !== t))}>
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        <input
                            placeholder={techStack.length ? "" : "Docker, Kubernetes…"}
                            value={techInput}
                            onChange={(e) => setTechInput(e.target.value)}
                            onKeyDown={(e) => handleTagKeyDown(e, techStack, setTechStack, techInput, setTechInput)}
                        />
                    </div>
                </div>

                {/* ---- TAG INPUT: Domains ---- */}
                <div className="form-group">
                    <label className="form-label">Domains</label>
                    <div className="tag-input-container">
                        {domains.map((d) => (
                            <span key={d} className="tag">
                                {d}
                                <button type="button" onClick={() => setDomains(domains.filter((x) => x !== d))}>
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        <input
                            placeholder={domains.length ? "" : "AI/ML, Web Dev…"}
                            value={domainInput}
                            onChange={(e) => setDomainInput(e.target.value)}
                            onKeyDown={(e) => handleTagKeyDown(e, domains, setDomains, domainInput, setDomainInput)}
                        />
                    </div>
                </div>

                {/* ---- GitHub Repo ---- */}
                <div className="form-group">
                    <label className="form-label" htmlFor="proj-github">GitHub Repository</label>
                    <input
                        id="proj-github"
                        className="form-input"
                        placeholder="https://github.com/user/repo"
                        value={form.githubRepo}
                        onChange={(e) => set("githubRepo", e.target.value)}
                    />
                </div>

                {/* ---- Action Buttons ---- */}
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
                        <FolderPlus size={18} />
                        {busy ? "Creating…" : "Create Project"}
                    </button>
                    {/* Cancel button — navigate(-1) goes back one page in browser history */}
                    {/* Like clicking the browser's Back button */}
                    <button className="btn btn-ghost btn-lg" type="button" onClick={() => navigate(-1)}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
