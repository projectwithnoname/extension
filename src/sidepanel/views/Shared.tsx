import Button from "../../shared/components/button/Button";
import EmptyState from "../../shared/components/emptyState/EmptyState";
import WorkspaceItem from "../components/workspaceItem/WorkspaceItem";
import { useAuth } from "../hooks/useAuth";
import useWorkspaces from "../hooks/useWorkspaces";
import "./Shared.scss";

const WorkspaceList = ({ sub }: { sub: string }) => {
  const state = useWorkspaces(sub);

  if (state.status === "loading") {
    return <div className="workspaceLoading" aria-busy="true" aria-label="Loading workspaces" />;
  }

  if (state.status === "error") {
    return (
      <div className="workspaceError">
        <p>
          {state.reason === "signed-out"
            ? "Your session expired. Sign in again to see your workspaces."
            : "Could not reach the website. Your workspaces live there, so this list needs it."}
        </p>
        <Button type="outline" palette="secondary" size="sm" onClick={state.reload}>
          Try again
        </Button>
      </div>
    );
  }

  if (state.workspaces.length === 0) {
    return <EmptyState message="No workspaces yet." />;
  }

  return state.workspaces.map((workspace) => <WorkspaceItem key={workspace.id} {...workspace} />);
};

const Shared = () => {
  const { state, signIn, signOut } = useAuth();

  if (state.status === "unknown") {
    return <div className="sharedView" aria-busy="true" />;
  }

  if (state.status === "signed-out") {
    return (
      <div className="sharedView prompt">
        <p>Sign in to sync your highlights and see what's shared with you.</p>
        <Button onClick={signIn}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="sharedView">
      <header className="account">
        {state.user.picture && <img className="avatar" src={state.user.picture} alt="" />}
        <div className="identity">
          <span className="name">{state.user.name}</span>
          <span className="email">{state.user.email}</span>
        </div>
        <Button type="outline" palette="secondary" size="sm" onClick={signOut}>
          Sign out
        </Button>
      </header>

      <WorkspaceList sub={state.user.sub} />
    </div>
  );
};

export default Shared;
