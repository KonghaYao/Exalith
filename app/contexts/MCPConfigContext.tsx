"use client";

import { createContext, useContext, ReactNode } from "react";
import { useCoAgent } from "@copilotkit/react-core";
import { useLocalStorage } from "../hooks/useLocalStorage";
import example from "../../mcp-config.example.json";
import { ServerConfig } from "./ServerConfig";

type ConnectionType = "stdio" | "sse";
export const ModelConfigs = [
  {
    label: "qwen-plus",
    value: "qwen-plus",
  },
  {
    label: "qwen-max",
    value: "qwen-max",
  },
  {
    label: "qwen-turbo",
    value: "qwen-turbo",
  },
  {
    label: "deepseek-chat",
    value: "deepseek-chat",
  },
];

export const ThinkingModelConfigs = [
  {
    label: "QWQ plus",
    value: "qwq-plus",
  },
  {
    label: "DeepSeek R1",
    value: "deepseek-reasoner",
  },
];
export interface AgentState {
  mcp_config: Record<string, ServerConfig>;
  plan_enabled: boolean;
  web_search_enabled: boolean;
  model_name: string;
  thinking_model?: string;
}

const STORAGE_KEY = "mcp-agent-state";

const clearAgentConfig = (config: Record<string, ServerConfig>) => {
  const filteredConfig: Record<string, ServerConfig> = {};
  for (const [key, value] of Object.entries(config)) {
    if (value.enable !== false) {
      const { enable, ...rest } = value;
      filteredConfig[key] = rest;
    }
  }
  return filteredConfig;
};

interface MCPConfigContextType {
  configs: Record<string, ServerConfig>;
  setConfigs: (newConfigs: Record<string, ServerConfig>) => void;
  resetConfig: () => void;
  isLoading: boolean;
  agentState: AgentState;
  setAgentState: (
    state: AgentState | ((state?: AgentState) => AgentState),
  ) => void;
}

const MCPConfigContext = createContext<MCPConfigContextType | undefined>(
  undefined,
);

export function MCPConfigProvider({ children }: { children: ReactNode }) {
  const [savedConfigs, setSavedConfigs] = useLocalStorage<
    Record<string, ServerConfig>
  >(STORAGE_KEY, example as any);
  const savedState = globalThis.localStorage?.getItem("mcp_input_state") || "";
  let extraConfig = {};
  if (savedState) {
    try {
      const state = JSON.parse(savedState);
      const { plan_enabled, web_search_enabled, model_name } = state;
      extraConfig = {
        plan_enabled,
        web_search_enabled,
        model_name,
      };
    } catch (e) {
      console.error("Failed to parse saved agent state:", e);
    }
  }
  const { state: agentState, setState: setAgentState } = useCoAgent<AgentState>(
    {
      name: "llm_agent",
      initialState: {
        mcp_config: clearAgentConfig(savedConfigs),
        plan_enabled: false,
        web_search_enabled: false,
        model_name: process.env.OPENAI_MODEL || "qwen-plus",
        ...extraConfig,
      },
    },
  );

  const configs = savedConfigs || {};

  const resetConfig = () => {
    setConfigs(example as any);
  };

  const setConfigs = (newConfigs: Record<string, ServerConfig>) => {
    setAgentState({ ...agentState, mcp_config: clearAgentConfig(newConfigs) });
    setSavedConfigs(newConfigs);
  };

  const isLoading = !agentState;

  return (
    <MCPConfigContext.Provider
      value={{
        configs,
        setConfigs,
        resetConfig,
        isLoading,
        agentState,
        setAgentState,
      }}
    >
      {children}
    </MCPConfigContext.Provider>
  );
}

export function useMCPConfig() {
  const context = useContext(MCPConfigContext);
  if (context === undefined) {
    throw new Error("useMCPConfig must be used within a MCPConfigProvider");
  }
  return context;
}
