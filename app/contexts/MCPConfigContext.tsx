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
    value: "qwen-max-latest",
  },
  {
    label: "deepseek-v3",
    value: "deepseek-chat",
  },
  {
    label: "quasar-alpha",
    value: "openrouter/quasar-alpha",
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

export interface KnowledgeConfigs {
  type: string;
  dataset_ids: [];
}
export interface AgentState {
  active_agent?: string;
  mcp_config: Record<string, ServerConfig>;
  knowledge_config: KnowledgeConfigs[];
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

export type ExtraConfig = Partial<
  Pick<
    AgentState,
    "model_name" | "plan_enabled" | "web_search_enabled" | "active_agent"
  >
>;
interface MCPConfigContextType {
  configs: Record<string, ServerConfig>;
  setConfigs: (newConfigs: Record<string, ServerConfig>) => void;
  resetConfig: () => void;
  isLoading: boolean;
  agentState: AgentState;
  setAgentState: (
    state: AgentState | ((state?: AgentState) => AgentState),
  ) => void;
  extraConfig: ExtraConfig;
  setExtraConfig: (
    state: ExtraConfig | ((state?: ExtraConfig) => ExtraConfig),
  ) => void;
}

const MCPConfigContext = createContext<MCPConfigContextType | undefined>(
  undefined,
);

export function MCPConfigProvider({ children }: { children: ReactNode }) {
  const [savedConfigs, setSavedConfigs] = useLocalStorage<
    Record<string, ServerConfig>
  >(STORAGE_KEY, example as any);
  const [extraConfig, setExtraConfig] = useLocalStorage("mcp-extraConfig", {});

  const { state: agentState, setState: setAgentState } = useCoAgent<AgentState>(
    {
      name: "llm_agent",
      initialState: {
        active_agent: "all_helper",
        mcp_config: clearAgentConfig(savedConfigs),
        knowledge_config: [],
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
        extraConfig,
        setExtraConfig,
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
