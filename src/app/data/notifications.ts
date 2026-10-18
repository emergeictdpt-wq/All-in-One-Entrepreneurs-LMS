// Notifications for the Program Managers page bell.
// They live in the same place Incubation Management keeps them (the "notifications" part of the admin decisions blob in
// localStorage), so a notification raised on one page shows up on the other, and reading it on one page marks it read on both.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DECISIONS_KEY } from "./applicationTracker";
import type { IncubationNotification } from "../components/IncubationManagementPage";
import type { EntrepreneurApplication, MentorApplication } from "../types";

/** Set before opening Incubation Management so it lands on the section a notification points at. */
export const INCUBATION_NAV_KEY = "emerge.incubation.nav";
/** Set alongside INCUBATION_NAV_KEY ("mentors" or "entrepreneurs") so it lands on the right tab. */
export const INCUBATION_TAB_KEY = "emerge.incubation.tab";

function readBlob(): Record<string, unknown> {
  try { const v = JSON.parse(localStorage.getItem(DECISIONS_KEY) ?? "null"); return v && typeof v === "object" ? v : {}; } catch { return {}; }
}
export function loadNotifications(seed: IncubationNotification[]): IncubationNotification[] {
  const n = readBlob().notifications;
  return Array.isArray(n) ? (n as IncubationNotification[]) : seed;
}
function saveNotifications(list: IncubationNotification[]) {
  // Read-modify-write: status overrides and pairings kept by Incubation Management must survive.
  try { localStorage.setItem(DECISIONS_KEY, JSON.stringify({ ...readBlob(), notifications: list })); } catch { /* storage full or blocked */ }
}

export function timeAgo(createdAt: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - createdAt) / 1000));
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

type NewNotification = Omit<IncubationNotification, "id" | "createdAt" | "read" | "timestamp">;

export function useManagerNotifications({ seed, allowedIds, entApps, mntApps }: {
  /** shown until anything has been saved, same as Incubation Management */
  seed: IncubationNotification[];
  /** programs the signed-in manager champions; notifications about other programs are not theirs to see */
  allowedIds: string[];
  /** live (submitted) applications; a new one raises a notification */
  entApps: EntrepreneurApplication[];
  mntApps: MentorApplication[];
}) {
  const [all, setAll] = useState<IncubationNotification[]>(() => loadNotifications(seed));
  const latest = useRef(all);
  latest.current = all;
  const allowedKey = allowedIds.join("|");
  const mine = useCallback((n: { programId?: string }) => !n.programId || allowedIds.includes(n.programId), [allowedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = useCallback((next: IncubationNotification[]) => { latest.current = next; setAll(next); saveNotifications(next); }, []);

  // Another tab (e.g. Incubation Management) changed them
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === DECISIONS_KEY) setAll(loadNotifications(seed)); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [seed]);

  const add = useCallback((n: NewNotification) => {
    commit([{ ...n, id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, createdAt: Date.now(), timestamp: "Just now", read: false }, ...latest.current]);
  }, [commit]);

  // New applications arriving while the manager is on this page (e.g. an applicant submitting in another tab)
  const prevEnt = useRef(entApps.length);
  const prevMnt = useRef(mntApps.length);
  useEffect(() => {
    if (entApps.length > prevEnt.current) {
      for (const a of entApps.slice(prevEnt.current)) {
        if (!mine(a)) continue;
        add({ audience: "entrepreneur", section: "Applications", title: "New Application Received", type: "info", actionTarget: "Applications",
          message: `${a.name} submitted an ${a.program} application for ${a.businessName || a.sector || "Venture"}${a.programName ? ` to ${a.programName}` : ""}.`,
          candidateName: a.name, candidateId: a.id, programId: a.programId });
      }
    }
    prevEnt.current = entApps.length;
  }, [entApps, add, mine]);
  useEffect(() => {
    if (mntApps.length > prevMnt.current) {
      for (const a of mntApps.slice(prevMnt.current)) {
        if (!mine(a)) continue;
        add({ audience: "mentor", section: "Applications", title: "New Mentor Application", type: "info", actionTarget: "Applications",
          message: `${a.name} applied to mentor${a.programName ? ` on ${a.programName}` : ""}.`,
          candidateName: a.name, candidateId: a.id, programId: a.programId });
      }
    }
    prevMnt.current = mntApps.length;
  }, [mntApps, add, mine]);

  const notifications = useMemo(
    () => all.filter(mine).map(n => ({ ...n, timestamp: timeAgo(n.createdAt) })),
    [all, mine],
  );

  return {
    notifications,
    markRead: (id: string) => commit(latest.current.map(n => (n.id === id ? { ...n, read: true } : n))),
    markAllRead: () => commit(latest.current.map(n => (mine(n) ? { ...n, read: true } : n))),
    clearAll: () => commit(latest.current.filter(n => !mine(n))),
    remove: (id: string) => commit(latest.current.filter(n => n.id !== id)),
  };
}
