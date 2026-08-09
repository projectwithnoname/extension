import { useState } from "react";
import Button from "../../shared/components/button/Button";
import { getMyData } from "../../shared/services/user";
import { useAuth } from "../hooks/useAuth";
import "./Shared.scss";

const Shared = () => {
  const { state, signIn, signOut } = useAuth();

  const [data, setData] = useState(null);

  const getData =  async() => {
    const data = await getMyData();
    setData(data)
    console.log(data);
    
  }

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

      <button onClick={getData}>get my data</button>

      <p>Shared highlights will appear here.</p>
    </div>
  );
};

export default Shared;
