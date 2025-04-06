"use client";

import { useState } from "react";
import { Header } from "./ServerForm/Header";
import { ServerStatistics } from "./ServerForm/ServerStatistics";
import { AddServerForm } from "./ServerForm/AddServerForm";
import { ServerList } from "./ServerForm/ServerList";
import { useMCPConfig } from "../contexts/MCPConfigContext";
import { ServerConfig } from "../contexts/ServerConfig";
import { ConfigManager } from "./ServerForm/ConfigManager";

type ConnectionType = "stdio" | "sse";

export function MCPConfigForm() {
  const { configs, setConfigs, resetConfig, isLoading } = useMCPConfig();

  const [serverName, setServerName] = useState("");
  const [connectionType, setConnectionType] = useState<ConnectionType>("stdio");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [showAddServerForm, setShowAddServerForm] = useState(false);
  const [editingServer, setEditingServer] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const totalServers = Object.keys(configs).length;
  const stdioServers = Object.values(configs).filter(
    (config) => config.transport === "stdio",
  ).length;
  const sseServers = Object.values(configs).filter(
    (config) => config.transport === "sse",
  ).length;

  const resetForm = () => {
    setServerName("");
    setCommand("");
    setArgs("");
    setUrl("");
    setHeaders({});
    setShowAddServerForm(false);
    setEditingServer(null);
    setIsEditing(false);
  };

  const { handleSubmit: addConfig } = ConfigManager({
    serverName,
    connectionType,
    command,
    args,
    url,
    headers,
    configs,
    setConfigs,
    editingServer: null,
    resetForm,
  });

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
      setHeaders(config.headers || {});
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
          setHeaders({});
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
        onResetConfig={resetConfig}
      />

      {showAddServerForm && (
        <AddServerForm
          isEditing={isEditing}
          serverName={serverName}
          connectionType={connectionType}
          command={command}
          args={args}
          url={url}
          headers={headers}
          onServerNameChange={setServerName}
          onConnectionTypeChange={setConnectionType}
          onCommandChange={setCommand}
          onArgsChange={setArgs}
          onUrlChange={setUrl}
          onHeadersChange={setHeaders}
          onClose={() => setShowAddServerForm(false)}
          onSubmit={() => {
            const { handleSubmit } = ConfigManager({
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
            });
            handleSubmit();
          }}
        />
      )}
    </div>
  );
}
