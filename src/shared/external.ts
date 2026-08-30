export interface PingMessage {
  type: "PING";
}

export interface SignOutMessage {
  type: "SIGN_OUT";
}

export interface PingResponse {
  ok: true;
  version: string;
}

export const isSignOutMessage = (message: unknown): message is SignOutMessage => {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  return (message as Partial<SignOutMessage>).type === "SIGN_OUT";
};

export const isPingMessage = (message: unknown): message is PingMessage => {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  return (message as Partial<PingMessage>).type === "PING";
};
