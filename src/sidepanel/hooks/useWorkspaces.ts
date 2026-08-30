import { useCallback, useEffect, useState } from "react";
import { fetchWorkspaces } from "../../shared/api";
import type { SharedWorkspace } from "../../shared/types";

type State =
  | { status: "loading" }
  | { status: "ready"; workspaces: SharedWorkspace[] }
  | { status: "error"; reason: "signed-out" | "unreachable" };

const useWorkspaces = (sub: string): State & { reload: () => void } => {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchWorkspaces(sub).then((result) => {
      if (cancelled) {
        return;
      }

      setState(
        result.ok ? { status: "ready", workspaces: result.workspaces } : { status: "error", reason: result.reason },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [sub, attempt]);

  const reload = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, reload };
};

export default useWorkspaces;
