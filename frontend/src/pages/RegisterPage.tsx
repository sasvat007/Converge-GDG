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
        if (!form.email || !form.password) {
            addToast("Email and password are required", "error");
            return;
        }
        if (!pdfFile) {
            addToast("Please upload your resume PDF", "error");
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
        <div className="auth-layout bg-doodle">
            {/* Blurred background image of students & teachers collaborating */}
            <img
                src="/register-bg.png"
                alt=""
                aria-hidden="true"
                className="auth-bg-image"
            />

            <div className="auth-container" style={{ maxWidth: 540 }}>
                <div className="auth-card-inner" style={{ minHeight: 'auto' }}>
                    <div className="auth-left" style={{ width: '100%', padding: '2.5rem' }}>
                        <div className="auth-card animate-fade-in" style={{ maxWidth: '100%' }}>
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
                                            placeholder=""
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
                                            placeholder=""
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
                                            <option value="">Select availability</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                {/* ---- Resume PDF Upload (required) ---- */}
                                <div className="form-group">
                                    <label className="form-label">Resume PDF *</label>
                                    <div
                                        className={`file-drop-zone ${dragOver ? "drag-active" : ""}`}
                                        onClick={() => fileRef.current?.click()}
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={handleDrop}
                                        style={dragOver ? { borderColor: "var(--accent)", background: "var(--accent-bg)" } : { padding: "1rem" }}
                                    >
                                        <Upload size={24} style={{ margin: "0 auto 0.5rem" }} />
                                        <p style={{ fontSize: "0.8rem", margin: 0 }}>{pdfFile ? pdfFile.name : "Click or drag PDF"}</p>
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept="application/pdf"
                                            style={{ display: "none" }}
                                            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                        />
                                    </div>
                                </div>

                                {/* ---- Submit Button ---- */}
                                <button className="btn btn-primary" type="submit" disabled={busy}>
                                    {busy ? "Creating account…" : "Create Account"}
                                    <UserPlus size={18} style={{ marginLeft: "0.5rem" }} />
                                </button>
                            </form>

                            <p className="auth-switch">
                                Already have an account? <Link to="/login">Sign in</Link>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="footer-links">
                    <a href="#">Help Center</a>
                    <div className="footer-dot"></div>
                    <a href="#">Student Guidelines</a>
                    <div className="footer-dot"></div>
                    <a href="#">Privacy</a>
                </div>
            </div>
        </div>
    );
}
