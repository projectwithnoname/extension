import { ACCESS_TOKEN_KEY, WEBSITE_ORIGIN } from "./auth";
import type { SharedWorkspace, WorkspaceAccess } from "./types";

interface WorkspacePayload {
  id: string;
  name: string;
  createdById: string;
  access: WorkspaceAccess;
  ownerEmail: string | null;
  members: { userId: string; email: string; access: WorkspaceAccess }[];
  highlightIds: string[];
}

export type WorkspacesResult =
  | { ok: true; workspaces: SharedWorkspace[] }
  | { ok: false; reason: "signed-out" }
  | { ok: false; reason: "unreachable" };

const toSharedWorkspace = (workspace: WorkspacePayload, sub: string): SharedWorkspace => ({
  id: workspace.id,
  name: workspace.name,
  access: workspace.access,
  owned: workspace.createdById === sub,
  ownerEmail: workspace.ownerEmail,
  memberCount: workspace.members.length,
  highlightCount: workspace.highlightIds.length,
});

export const fetchWorkspaces = async (sub: string): Promise<WorkspacesResult> => {
  const stored = await chrome.storage.local.get(ACCESS_TOKEN_KEY);
  const token = stored[ACCESS_TOKEN_KEY] as string | undefined;

  if (!token) {
    return { ok: false, reason: "signed-out" };
  }

  try {
    const response = await fetch(`${WEBSITE_ORIGIN}/api/workspace`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      return { ok: false, reason: "signed-out" };
    }

    if (!response.ok) {
      return { ok: false, reason: "unreachable" };
    }

    const payload: WorkspacePayload[] = await response.json();

    return { ok: true, workspaces: payload.map((w) => toSharedWorkspace(w, sub)) };
  } catch (error) {
    console.warn("Could not load workspaces", error);

    return { ok: false, reason: "unreachable" };
  }
};
