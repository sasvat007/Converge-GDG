// ============================================================================
// src/pages/NotificationsPage.tsx — Incoming Requests & Notifications
// ============================================================================
//
// This page shows all incoming teammate requests and rating requests.
// Users can accept or reject pending requests.
//
// FEATURES:
//   • Tab filtering (All / Team Invites / Ratings)
//   • Accept/Reject actions with loading states per-item
//   • Optimistic update — removes the request from the list immediately on action
//
// REACT CONCEPTS:
//   • Record<number, boolean> — An object used as a lookup map
//     (e.g., { 42: true, 73: false } tracks which request IDs are being processed)
//   • Discriminated union type — The `as const` on the tabs array tells TypeScript
//     these are literal string values, not generic strings
// ============================================================================

import { useEffect, useState } from "react";
import { getIncomingRequests, acceptRequest, rejectRequest } from "../api/client";
import { useToast } from "../context/ToastContext";
import type { TeamRequest } from "../types";
import { UserPlus, Star, Check, X, Inbox } from "lucide-react";

export default function NotificationsPage() {
    const { addToast } = useToast();

    // ---- STATE ----
    const [requests, setRequests] = useState<TeamRequest[]>([]);         // All requests from API
    const [loading, setLoading] = useState(true);

    // PROCESSING MAP — Tracks which requests are currently being accepted/rejected.
    // Record<number, boolean> is a TypeScript type meaning "object with number keys and boolean values".
    // Example: { 42: true } means request #42 is currently being processed (show loading spinner).
    // This allows multiple requests to be processed independently.
    const [processing, setProcessing] = useState<Record<number, boolean>>({});

    // TAB STATE — Filters which requests to show
    // The type `"all" | "join" | "rating"` restricts the value to exactly these three strings.
    const [tab, setTab] = useState<"all" | "join" | "rating">("all");

    // ---- FETCH REQUESTS ON MOUNT ----
    useEffect(() => {
        getIncomingRequests()
            .then((r) => setRequests(r as unknown as TeamRequest[]))
            .catch(() => addToast("Failed to load notifications", "error"))
            .finally(() => setLoading(false));
    }, []);

    // ---- ACCEPT / REJECT HANDLER ----
    // A single function handles both accept and reject actions.
    // The `accept` boolean parameter determines which API to call.
    const handle = async (r: TeamRequest, accept: boolean) => {
        // Mark this specific request as "processing" (disables its buttons)
        setProcessing((p) => ({ ...p, [r.requestId]: true }));
        // Spread operator: keeps all existing entries and adds/updates this one

        try {
            if (accept) {
                await acceptRequest(r.requestId);
                addToast("Request accepted! 🎉", "success");
            } else {
                await rejectRequest(r.requestId);
                addToast("Request rejected", "info");
            }
            // OPTIMISTIC UPDATE — Remove the request from the local list immediately.
            // We don't need to re-fetch the entire list from the API.
            setRequests((prev) => prev.filter((x) => x.requestId !== r.requestId));
        } catch (err: any) {
            addToast(err?.message || "Action failed", "error");
        } finally {
            // Clear the processing state for this request
            setProcessing((p) => ({ ...p, [r.requestId]: false }));
        }
    };

    if (loading) return <div className="spinner-overlay"><div className="spinner" /></div>;

    // ---- CLIENT-SIDE TAB FILTERING ----
    const filtered = requests.filter((r) => {
        if (tab === "join") return r.type === "JOIN_REQUEST";
        if (tab === "rating") return r.type === "RATING_REQUEST";
        return true;  // "all" tab shows everything
    });

    // Count of pending requests (shown in the header subtitle)
    const pending = requests.filter((r) => r.status === "PENDING").length;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Notifications</h1>
                {/* Dynamic subtitle based on pending count */}
                <p>{pending > 0 ? `${pending} pending request${pending > 1 ? "s" : ""}` : "You're all caught up!"}</p>
            </div>

            {/* ---- TAB BUTTONS ---- */}
            {/* `as const` makes TypeScript treat the array values as literal types */}
            {/* Without it, TS would type them as string[], losing the specific values */}
            <div className="tabs">
                {(["all", "join", "rating"] as const).map((t) => (
                    <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                        {t === "all" ? `All (${requests.length})` : t === "join" ? "Team Invites" : "Ratings"}
                    </button>
                ))}
            </div>

            {/* ---- REQUEST LIST ---- */}
            {filtered.length === 0 ? (
                <div className="empty-state"><Inbox /><h3>No notifications</h3><p>Invitations and rating requests will appear here</p></div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {filtered.map((r, i) => (
                        <div key={r.requestId} className="notification-card" style={{ animationDelay: `${i * 0.06}s` }}>
                            {/* ---- ICON (different for join vs rating requests) ---- */}
                            <div className={`notification-icon ${r.type === "JOIN_REQUEST" ? "join" : "rating"}`}>
                                {r.type === "JOIN_REQUEST" ? <UserPlus /> : <Star />}
                            </div>

                            {/* ---- NOTIFICATION BODY ---- */}
                            <div className="notification-body">
                                <h4>{r.type === "JOIN_REQUEST" ? `Invitation — ${r.projectTitle || `Project #${r.projectId}`}` : `Rate — ${r.rateeName || r.rateeEmail}`}</h4>
                                <p>{r.type === "JOIN_REQUEST" ? `${r.requesterEmail} invited you` : `Rate ${r.rateeName || r.rateeEmail} on "${r.projectTitle}"`}</p>
                                <span className="time">{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>

                            {/* ---- ACTION BUTTONS or STATUS BADGE ---- */}
                            {/* Show accept/reject buttons only for PENDING requests */}
                            {r.status === "PENDING" ? (
                                <div className="notification-actions">
                                    <button className="btn btn-success btn-sm" onClick={() => handle(r, true)} disabled={processing[r.requestId]}>
                                        {/* processing[r.requestId] looks up this request's loading state */}
                                        <Check size={14} /> Accept
                                    </button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handle(r, false)} disabled={processing[r.requestId]}>
                                        <X size={14} /> Reject
                                    </button>
                                </div>
                            ) : (
                                // Already processed — show the status as a badge
                                <span className={`badge ${r.status === "ACCEPTED" ? "badge-success" : "badge-neutral"}`}>{r.status}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
