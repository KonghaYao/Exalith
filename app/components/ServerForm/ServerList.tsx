"use client";

import { ServerConfig } from "@/app/contexts/ServerConfig";
import {
  Power,
  PowerOff,
  Edit,
  Trash2,
  RefreshCw,
  Monitor,
  Globe,
  ExternalLink,
} from "lucide-react";

export interface ServerListProps {
  configs: Record<string, ServerConfig>;
  onEditServer: (name: string, config: ServerConfig) => void;
  onRemoveServer: (name: string) => void;
  onToggleServer: (name: string, config: ServerConfig) => void;
  onResetConfig: () => void;
}

export function ServerList({
  configs,
  onEditServer,
  onRemoveServer,
  onToggleServer,
  onResetConfig,
}: ServerListProps) {
  const totalServers = Object.keys(configs).length;

  return (
    <div className="bg-white rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Server List</h2>
        <button
          onClick={() => {
            if (
              window.confirm("确定要重置所有服务器配置吗？这将恢复到默认配置。")
            ) {
              onResetConfig();
            }
          }}
          className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          重置配置
        </button>
      </div>

      {totalServers === 0 ? (
        <div className="text-gray-500 text-center py-10">
          No servers configured. Click &quot;Add Server&quot; to get started.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(configs).map(([name, config]) => (
            <div
              key={name}
              className={`border rounded-md overflow-hidden bg-white shadow-sm ${
                config.enable !== false ? "border-blue-500" : "border-gray-200"
              }`}
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{name}</h3>
                    <div className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-xs rounded mt-1">
                      {config.transport === "stdio" ? (
                        <Monitor className="w-3 h-3 mr-1" />
                      ) : (
                        <Globe className="w-3 h-3 mr-1" />
                      )}
                      {config.transport}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onToggleServer(name, config)}
                      className={`text-gray-400 hover:text-blue-500 ${
                        config.enable === false
                          ? "text-gray-300"
                          : "text-blue-500"
                      }`}
                    >
                      {config.enable === false ? (
                        <PowerOff className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onEditServer(name, config)}
                      className="text-gray-400 hover:text-blue-500"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoveServer(name)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  {config.transport === "stdio" ? (
                    <>
                      <p>Command: {config.command}</p>
                      <p className="truncate">Args: {config.args.join(" ")}</p>
                    </>
                  ) : (
                    <p className="truncate">URL: {config.url}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 pt-4 border-t text-center text-sm text-gray-500">
        More MCP servers available on the web, e.g.{" "}
        <a
          href="https://mcp.composio.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-700 hover:text-gray-900 inline-flex items-center mr-2"
        >
          mcp.composio.dev
          <ExternalLink className="w-3 h-3 ml-1" />
        </a>
        and{" "}
        <a
          href="https://www.mcp.run/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-700 hover:text-gray-900 inline-flex items-center"
        >
          mcp.run
          <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </div>
    </div>
  );
}
