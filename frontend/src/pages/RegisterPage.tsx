// ============================================================================
// src/pages/RegisterPage.tsx — User Registration Page
// ============================================================================
//
// This page handles new user sign-up. It collects:
//   • Email + password (required)
//   • Profile info: name, year, department, institution, availability (optional)
//   • Resume text (required — parsed by AI on the backend)
//   • Resume PDF file (optional — uploaded as base64)
//
// FLOW:
// 1. User fills out the multi-field form
// 2. If a PDF is attached, it's converted to base64 (text encoding of binary data)
// 3. All data is sent to POST /auth/register
// 4. Backend returns a JWT token → user is logged in and redirected to /dashboard
//
// NEW REACT CONCEPTS IN THIS FILE:
//   • useRef — A way to hold a reference to a DOM element (the hidden file input)
//   • DragEvent — TypeScript type for drag-and-drop events
//   • Spread operator (...form) — Copies all properties from one object into another
//   • Compound state — Using a single useState with an object instead of many individual states
// ============================================================================

import { useState, type FormEvent, useRef, type DragEvent } from "react";
// useRef — Creates a mutable reference that persists across re-renders.
//   Unlike useState, changing a ref does NOT trigger a re-render.
//   Common use: holding a reference to a DOM element (like an <input>).

import { Link, useNavigate } from "react-router-dom";
import { register as apiRegister, fileToBase64 } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { UserPlus, Upload } from "lucide-react";

export default function RegisterPage() {
    // ---- COMPOUND STATE ----
    // Instead of creating 8 separate useState calls (one per field), we use a
    // single state object. This is common for forms with many fields.
    // The `set` helper below updates one field at a time using the spread operator.
    const [form, setForm] = useState({
        email: "",
        password: "",
        name: "",
        year: "",
        department: "",
        institution: "",
        availability: "medium",  // Default value
        resumeText: "",
    });

    const [pdfFile, setPdfFile] = useState<File | null>(null);  // Selected PDF file
    const [busy, setBusy] = useState(false);                    // Loading state
    const [dragOver, setDragOver] = useState(false);             // Drag-and-drop visual feedback

    // ---- useRef FOR FILE INPUT ----
    // The file input is hidden (display: none). We trigger it programmatically
    // when the user clicks the drop zone. useRef gives us a reference to that
    // hidden <input> element so we can call .click() on it.
    const fileRef = useRef<HTMLInputElement>(null);
    // The <HTMLInputElement> generic tells TypeScript what type of DOM element this ref points to.

    const { setAuth } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    // ---- HELPER: UPDATE A SINGLE FORM FIELD ----
    // `set("email", "user@test.com")` updates just the email field while keeping all others.
    // The spread operator `...p` copies all existing fields, then `[key]: val` overrides one.
    // [key] is a "computed property name" — it uses the variable `key` as the property name.
    const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

    // ---- FILE HANDLING ----
    // Validates the file type and stores it in state
    const handleFile = (file: File) => {
        if (file.type !== "application/pdf") {
            addToast("Please upload a PDF file", "error");
            return;
        }
        setPdfFile(file);
        addToast(`Resume "${file.name}" attached`, "success");
    };

    // ---- DRAG AND DROP HANDLER ----
    // Called when the user drops a file onto the drop zone.
    // DragEvent is the TypeScript type for drag-related browser events.
    const handleDrop = (e: DragEvent) => {
        e.preventDefault();              // Prevent browser from opening the file
        setDragOver(false);              // Remove the visual "drag active" feedback
        const file = e.dataTransfer.files?.[0];  // Get the first dropped file
        if (file) handleFile(file);
    };

    // ---- FORM SUBMISSION ----
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Client-side validation
        if (!form.email || !form.password || !form.resumeText) {
            addToast("Email, password and resume text are required", "error");
            return;
        }

        setBusy(true);
        try {
            // Convert PDF to base64 string if one was uploaded
            let resumePdf: string | null = null;
            if (pdfFile) resumePdf = await fileToBase64(pdfFile);

            // Call the register API endpoint
            // `...form` spreads all form fields into the request body
            // `resumePdf` is added as an additional field
            const data = await apiRegister({
                ...form,
                resumePdf,
            });

            // On success: store token and redirect
            setAuth(data.token, data.profile as any);
            addToast("Account created successfully!", "success");
            navigate("/dashboard");
        } catch (err: any) {
            addToast(err?.message || "Registration failed", "error");
        } finally {
            setBusy(false);
        }
    };

    // ---- JSX ----
    return (
        <div className="auth-layout">
            <div className="auth-left">
                <div className="auth-card" style={{ animation: "fadeIn 0.5s ease", maxWidth: 480 }}>
                    <h1>Join Converge</h1>
                    <p className="subtitle">Create your profile and start finding collaborators</p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {/* ---- ROW: Name + Email ---- */}
                        {/* form-row is a CSS class that makes children display side by side */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-name">Full Name</label>
                                <input
                                    id="reg-name"
                                    className="form-input"
                                    placeholder="John Doe"
                                    value={form.name}
                                    onChange={(e) => set("name", e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-email">Email *</label>
                                <input
                                    id="reg-email"
                                    className="form-input"
                                    type="email"
                                    placeholder="you@university.edu"
                                    value={form.email}
                                    onChange={(e) => set("email", e.target.value)}
                                    required  // HTML5 validation — browser shows error if empty on submit
                                />
                            </div>
                        </div>

                        {/* ---- Password ---- */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-password">Password *</label>
                            <input
                                id="reg-password"
                                className="form-input"
                                type="password"
                                placeholder="Create a strong password"
                                value={form.password}
                                onChange={(e) => set("password", e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        {/* ---- ROW: Year + Department ---- */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-year">Year</label>
                                {/* <select> in React works just like a controlled input — */}
                                {/* value tracks the state, onChange updates it */}
                                <select
                                    id="reg-year"
                                    className="form-select"
                                    value={form.year}
                                    onChange={(e) => set("year", e.target.value)}
                                >
                                    <option value="">Select year</option>
                                    <option value="1st Year">1st Year</option>
                                    <option value="2nd Year">2nd Year</option>
                                    <option value="3rd Year">3rd Year</option>
                                    <option value="4th Year">4th Year</option>
                                    <option value="Graduate">Graduate</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-dept">Department</label>
                                <input
                                    id="reg-dept"
                                    className="form-input"
                                    placeholder="Computer Science"
                                    value={form.department}
                                    onChange={(e) => set("department", e.target.value)}
                                />
                            </div>
                        </div>

                        {/* ---- ROW: Institution + Availability ---- */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-institution">Institution</label>
                                <input
                                    id="reg-institution"
                                    className="form-input"
                                    placeholder="MIT"
                                    value={form.institution}
                                    onChange={(e) => set("institution", e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-availability">Availability</label>
                                <select
                                    id="reg-availability"
                                    className="form-select"
                                    value={form.availability}
                                    onChange={(e) => set("availability", e.target.value)}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        {/* ---- Resume Text (required) ---- */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-resume">Resume Text *</label>
                            {/* <textarea> works the same as <input> in React — controlled via value + onChange */}
                            <textarea
                                id="reg-resume"
                                className="form-textarea"
                                placeholder="Paste your resume content here... This will be parsed by AI to build your profile."
                                value={form.resumeText}
                                onChange={(e) => set("resumeText", e.target.value)}
                                rows={4}
                                required
                            />
                        </div>

                        {/* ---- Resume PDF Upload (optional) ---- */}
                        <div className="form-group">
                            <label className="form-label">Resume PDF (optional)</label>
                            {/* FILE DROP ZONE — A custom-styled area for drag-and-drop file upload */}
                            <div
                                className={`file-drop-zone ${dragOver ? "drag-active" : ""}`}
                                // Click → trigger the hidden <input type="file">
                                onClick={() => fileRef.current?.click()}
                                // `fileRef.current` is the actual DOM element
                                // `?.click()` safely calls click() if the element exists

                                // Drag-and-drop event handlers:
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                // ^ Must preventDefault to allow dropping (browser default is to open the file)
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                // Dynamic inline styles for drag feedback
                                style={dragOver ? { borderColor: "var(--accent)", background: "var(--accent-bg)" } : {}}
                            >
                                <Upload />
                                {/* Conditional content: show filename if selected, otherwise placeholder */}
                                <p>{pdfFile ? pdfFile.name : "Click or drag PDF here"}</p>
                                <p className="hint">Max 10 MB</p>
                                {/* Hidden file input — triggered by the onClick above */}
                                <input
                                    ref={fileRef}
                                    // `ref={fileRef}` connects this DOM element to the useRef variable
                                    // So fileRef.current = this <input> element
                                    type="file"
                                    accept="application/pdf"
                                    style={{ display: "none" }}
                                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                    // When a file is selected, grab the first file and process it
                                />
                            </div>
                        </div>

                        {/* ---- Submit Button ---- */}
                        <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
                            <UserPlus size={18} />
                            {busy ? "Creating account…" : "Create Account"}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>

            {/* RIGHT PANEL — Marketing text */}
            <div className="auth-right">
                <div className="auth-hero-text">
                    <h2>Build Together, Grow Together</h2>
                    <p>
                        Upload your resume, let AI parse your skills, and find the perfect
                        teammates for your next big project.
                    </p>
                </div>
            </div>
        </div>
    );
}
