import Button from "../../shared/components/button/Button";
import { WEBSITE_ORIGIN } from "../../shared/auth";
import { useAuth } from "../hooks/useAuth";
import "./Shared.scss";

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

  if (state.status === "pending-verification") {
    return (
      <div className="sharedView prompt">
        <p>
          Almost there — verify <strong>{state.user.email}</strong> to finish setting up your account.
        </p>
        <a className="link" href={`${WEBSITE_ORIGIN}/verify-email`} target="_blank" rel="noreferrer">
          Open verification page
        </a>
        <Button type="outline" palette="secondary" size="sm" onClick={signOut}>
          Sign out
        </Button>
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

      <p>Shared highlights will appear here.</p>
    </div>
  );
};

export default Shared;
