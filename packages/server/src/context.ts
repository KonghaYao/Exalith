import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

export const context: Record<string, any> = {};

export const useContext = (extra: RequestHandlerExtra) => {
  if (!extra.sessionId) {
    console.log("SessionId is null");
    return {};
  }
  return context[extra.sessionId];
};
