import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
  langGraphPlatformEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import OpenAI from "openai";

const serviceAdapter = new OpenAIAdapter({
  /** @ts-ignore fix openai doesn't support developer role */
  openai: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
    fetch(url, options) {
      /** @ts-ignore */
      const data = JSON.parse(options?.body);
      data.messages.forEach((m: any) => {
        if (m.role === "developer") {
          m.role = "system";
          return m;
        }
        return m;
      });
      /** @ts-ignore */
      options.body = JSON.stringify(data);
      /** @ts-ignore */
      delete options?.headers["content-length"];
      return fetch(url, options);
    },
  }),
  model: process.env.OPENAI_MODEL || "qwen-plus",
});
const runtime = new CopilotRuntime({
  remoteEndpoints: [
    langGraphPlatformEndpoint({
      deploymentUrl: `${
        process.env.AGENT_DEPLOYMENT_URL || "http://localhost:8123"
      }`,
      langsmithApiKey: process.env.LANGSMITH_API_KEY,
      agents: [
        {
          name: "sample_agent",
          description: "A helpful LLM agent.",
        },
      ],
    }),
  ],
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
