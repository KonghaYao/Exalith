"use client";

import { ServerConfig } from "../../contexts/MCPConfigContext";

type ConnectionType = "stdio" | "sse";

interface ConfigManagerProps {
  serverName: string;
  connectionType: ConnectionType;
  command: string;
  args: string;
  url: string;
  headers: Record<string, string>;
  configs: Record<string, ServerConfig>;
  setConfigs: (newConfigs: Record<string, ServerConfig>) => void;
  editingServer: string | null;
  resetForm: () => void;
}

export function ConfigManager({
  serverName,
  connectionType,
  command,
  args,
  url,
  headers,
  configs,
  setConfigs,
  editingServer,
  resetForm,
}: ConfigManagerProps) {
  const handleStdioConfig = () => {
    const stdioConfig = {
      command,
      args: args.split(" ").filter((arg) => arg.trim() !== ""),
      transport: "stdio" as const,
      enable: true,
    };

    if (editingServer && editingServer !== serverName) {
      const newConfigs = { ...configs };
      delete newConfigs[editingServer];
      setConfigs({
        ...newConfigs,
        [serverName]: stdioConfig,
      });
    } else {
      setConfigs({
        ...configs,
        [serverName]: stdioConfig,
      });
    }
  };

  const handleSSEConfig = () => {
    const sseConfig = {
      url,
      transport: "sse" as const,
      enable: true,
      headers,
    };

    if (editingServer && editingServer !== serverName) {
      const newConfigs = { ...configs };
      delete newConfigs[editingServer];
      setConfigs({
        ...newConfigs,
        [serverName]: sseConfig,
      });
    } else {
      setConfigs({
        ...configs,
        [serverName]: sseConfig,
      });
    }
  };

  const handleSubmit = () => {
    if (!serverName) return;

    if (connectionType === "stdio") {
      handleStdioConfig();
    } else {
      handleSSEConfig();
    }

    resetForm();
  };

  return { handleSubmit };
}
