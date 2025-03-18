"use client";

import { useState, useEffect } from "react";
import { useCoAgent } from "@copilotkit/react-core";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Header } from "./ServerForm/Header";
import { ServerStatistics } from "./ServerForm/ServerStatistics";
import { AddServerForm } from "./ServerForm/AddServerForm";
import { ServerList } from "./ServerForm/ServerList";

type ConnectionType = "stdio" | "sse";

interface StdioConfig {
  command: string;
  args: string[];
  transport: "stdio";
  enable?: boolean;
}

interface SSEConfig {
  url: string;
  transport: "sse";
  enable?: boolean;
}

type ServerConfig = StdioConfig | SSEConfig;

interface AgentState {
  mcp_config: Record<string, ServerConfig>;
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
import example from '../../mcp-config.example.json'
export function MCPConfigForm() {
  const [savedConfigs, setSavedConfigs] = useLocalStorage<
    Record<string, ServerConfig>
  >(STORAGE_KEY, example);
  const { state: agentState, setState: setAgentState } = useCoAgent<AgentState>(
    {
      name: "llm_agent",
      initialState: {
        mcp_config: clearAgentConfig(savedConfigs),
      },
    }
  );

  const configs = savedConfigs || {};
  const setConfigs = (newConfigs: Record<string, ServerConfig>) => {
    setAgentState({ ...agentState, mcp_config: clearAgentConfig(newConfigs) });
    setSavedConfigs(newConfigs);
  };

  const [serverName, setServerName] = useState("");
  const [connectionType, setConnectionType] = useState<ConnectionType>("stdio");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddServerForm, setShowAddServerForm] = useState(false);
  const [editingServer, setEditingServer] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const totalServers = Object.keys(configs).length;
  const stdioServers = Object.values(configs).filter(
    (config) => config.transport === "stdio"
  ).length;
  const sseServers = Object.values(configs).filter(
    (config) => config.transport === "sse"
  ).length;

  useEffect(() => {
    if (agentState) {
      setIsLoading(false);
    }
  }, [agentState]);

  const addConfig = () => {
    if (!serverName) return;
    const newConfig =
      connectionType === "stdio"
        ? {
            command,
            args: args.split(" ").filter((arg) => arg.trim() !== ""),
            transport: "stdio" as const,
            enable: true,
          }
        : {
            url,
            transport: "sse" as const,
            enable: true,
          };

    setConfigs({
      ...configs,
      [serverName]: newConfig,
    });

    setServerName("");
    setCommand("");
    setArgs("");
    setUrl("");
    setShowAddServerForm(false);
  };

  const removeConfig = (name: string) => {
    const newConfigs = { ...configs };
    delete newConfigs[name];
    setConfigs(newConfigs);
  };

  const exportConfig = () => {
    const date = new Date().toISOString().split("T")[0];
    const filename = `mcp-config-${date}.json`;
    const jsonStr = JSON.stringify(configs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedConfig = JSON.parse(content);
        setConfigs(importedConfig);
      } catch (error) {
        alert("导入配置文件失败，请确保文件格式正确");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleEditServer = (name: string, config: ServerConfig) => {
    setEditingServer(name);
    setIsEditing(true);
    setShowAddServerForm(true);
    setServerName(name);
    setConnectionType(config.transport);
    if (config.transport === "stdio") {
      setCommand(config.command);
      setArgs(config.args.join(" "));
    } else {
      setUrl(config.url);
    }
  };

  const handleToggleServer = (name: string, config: ServerConfig) => {
    const newConfigs = { ...configs };
    newConfigs[name] = {
      ...config,
      enable: config.enable === false ? true : false,
    };
    setConfigs(newConfigs);
  };

  if (isLoading) {
    return <div className="p-4">Loading configuration...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Header
        onImportConfig={importConfig}
        onExportConfig={exportConfig}
        onAddServer={() => {
          setIsEditing(false);
          setEditingServer(null);
          setServerName("");
          setCommand("");
          setArgs("");
          setUrl("");
          setShowAddServerForm(true);
        }}
      />

      <ServerStatistics
        totalServers={totalServers}
        stdioServers={stdioServers}
        sseServers={sseServers}
        enabledServers={
          Object.values(configs).filter((config) => config.enable !== false)
            .length
        }
      />

      <ServerList
        configs={configs}
        onEditServer={handleEditServer}
        onRemoveServer={removeConfig}
        onToggleServer={handleToggleServer}
      />

      {showAddServerForm && (
        <AddServerForm
          isEditing={isEditing}
          serverName={serverName}
          connectionType={connectionType}
          command={command}
          args={args}
          url={url}
          onServerNameChange={setServerName}
          onConnectionTypeChange={setConnectionType}
          onCommandChange={setCommand}
          onArgsChange={setArgs}
          onUrlChange={setUrl}
          onClose={() => setShowAddServerForm(false)}
          onSubmit={() => {
            if (isEditing) {
              if (editingServer && editingServer !== serverName) {
                const newConfigs = { ...configs };
                delete newConfigs[editingServer];
                const updatedConfig =
                  connectionType === "stdio"
                    ? {
                        command,
                        args: args
                          .split(" ")
                          .filter((arg) => arg.trim() !== ""),
                        transport: "stdio" as const,
                      }
                    : {
                        url,
                        transport: "sse" as const,
                      };
                setConfigs({
                  ...newConfigs,
                  [serverName]: updatedConfig,
                });
              } else {
                const updatedConfig =
                  connectionType === "stdio"
                    ? {
                        command,
                        args: args
                          .split(" ")
                          .filter((arg) => arg.trim() !== ""),
                        transport: "stdio" as const,
                      }
                    : {
                        url,
                        transport: "sse" as const,
                      };
                setConfigs({
                  ...configs,
                  [serverName]: updatedConfig,
                });
              }
            } else {
              addConfig();
            }
            setEditingServer(null);
            setIsEditing(false);
            setShowAddServerForm(false);
            setServerName("");
            setCommand("");
            setArgs("");
            setUrl("");
          }}
        />
      )}
    </div>
  );
}
