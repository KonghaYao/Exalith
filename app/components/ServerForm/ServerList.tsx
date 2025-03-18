"use client";

import { Power, PowerOff } from "lucide-react";

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

interface ServerListProps {
  configs: Record<string, ServerConfig>;
  onEditServer: (name: string, config: ServerConfig) => void;
  onRemoveServer: (name: string) => void;
  onToggleServer: (name: string, config: ServerConfig) => void;
}

export function ServerList({
  configs,
  onEditServer,
  onRemoveServer,
  onToggleServer,
}: ServerListProps) {
  const totalServers = Object.keys(configs).length;

  return (
    <div className="bg-white border rounded-md p-6">
      <h2 className="text-lg font-semibold mb-4">Server List</h2>

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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3 h-3 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3 h-3 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                          />
                        </svg>
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onRemoveServer(name)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 h-3 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
        and{" "}
        <a
          href="https://www.mcp.run/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-700 hover:text-gray-900 inline-flex items-center"
        >
          mcp.run
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 h-3 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
