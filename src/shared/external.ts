export interface PingMessage {
  type: "PING";
}

export interface PingResponse {
  ok: true;
  version: string;
}

export const isPingMessage = (message: unknown): message is PingMessage => {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  return (message as Partial<PingMessage>).type === "PING";
};
