"use client";

import { PenSquare, Plus, X, Terminal, Globe, Check, Server } from "lucide-react";

interface AddServerFormProps {
  isEditing: boolean;
  serverName: string;
  connectionType: "stdio" | "sse" | "mcp";
  command: string;
  args: string;
  url: string;
  headers: Record<string, string>;
  mcpName: string;
  onServerNameChange: (value: string) => void;
  onConnectionTypeChange: (type: "stdio" | "sse" | "mcp") => void;
  onCommandChange: (value: string) => void;
  onArgsChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onHeadersChange: (headers: Record<string, string>) => void;
  onMcpNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function AddServerForm({
  isEditing,
  serverName,
  connectionType,
  command,
  args,
  url,
  headers,
  mcpName,
  onServerNameChange,
  onConnectionTypeChange,
  onCommandChange,
  onArgsChange,
  onUrlChange,
  onHeadersChange,
  onMcpNameChange,
  onClose,
  onSubmit,
}: AddServerFormProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="border-gradient-cool shadow-2xl rounded-lg p-6 w-full max-w-md ">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            {isEditing ? (
              <PenSquare className="w-5 h-5 mr-2" />
            ) : (
              <Plus className="w-5 h-5 mr-2" />
            )}
            {isEditing ? "Edit Server" : "Add New Server"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Server Name
            </label>
            <input
              type="text"
              value={serverName}
              onChange={(e) => onServerNameChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="e.g., api-service, data-processor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Connection Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onConnectionTypeChange("stdio")}
                className={`px-3 py-2 border rounded-md text-center flex items-center justify-center ${
                  connectionType === "stdio"
                    ? "bg-gray-200 border-gray-400 text-gray-800"
                    : "bg-white text-gray-700"
                }`}
              >
                <Terminal className="w-4 h-4 mr-1" />
                Standard IO
              </button>
              <button
                type="button"
                onClick={() => onConnectionTypeChange("sse")}
                className={`px-3 py-2 border rounded-md text-center flex items-center justify-center ${
                  connectionType === "sse"
                    ? "bg-gray-200 border-gray-400 text-gray-800"
                    : "bg-white text-gray-700"
                }`}
              >
                <Globe className="w-4 h-4 mr-1" />
                SSE
              </button>
              <button
                type="button"
                onClick={() => onConnectionTypeChange("mcp")}
                className={`px-3 py-2 border rounded-md text-center flex items-center justify-center ${
                  connectionType === "mcp"
                    ? "bg-gray-200 border-gray-400 text-gray-800"
                    : "bg-white text-gray-700"
                }`}
              >
                <Server className="w-4 h-4 mr-1" />
                MCP
              </button>
            </div>
          </div>

          {connectionType === "stdio" ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Command
                </label>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => onCommandChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="e.g., python, node"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Arguments
                </label>
                <input
                  type="text"
                  value={args}
                  onChange={(e) => onArgsChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="e.g., path/to/script.py"
                />
              </div>
            </>
          ) : connectionType === "sse" ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => onUrlChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="e.g., http://localhost:8000/events"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Environment
                </label>
                <div className="space-y-2">
                  {Object.entries(headers).map(([key, value], index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newHeaders = { ...headers };
                          const oldValue = newHeaders[key];
                          delete newHeaders[key];
                          newHeaders[e.target.value] = oldValue;
                          onHeadersChange(newHeaders);
                        }}
                        className="w-1/2 px-3 py-2 border rounded-md text-sm"
                        placeholder="Header name"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          onHeadersChange({
                            ...headers,
                            [key]: e.target.value,
                          });
                        }}
                        className="w-1/2 px-3 py-2 border rounded-md text-sm"
                        placeholder="Header value"
                      />
                      <button
                        onClick={() => {
                          const newHeaders = { ...headers };
                          delete newHeaders[key];
                          onHeadersChange(newHeaders);
                        }}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newKey = `header${Object.keys(headers).length + 1}`;
                      onHeadersChange({ ...headers, [newKey]: "" });
                    }}
                    className="w-full px-3 py-2 border border-dashed rounded-md text-sm text-gray-600 hover:text-gray-800 hover:border-gray-400"
                  >
                    + Add Header
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">
                MCP Name
              </label>
              <input
                type="text"
                value={mcpName}
                onChange={(e) => onMcpNameChange?.(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="e.g., mcp-excel"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium flex items-center"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 text-sm font-medium flex items-center"
            >
              {isEditing ? (
                <Check className="w-4 h-4 mr-1" />
              ) : (
                <Plus className="w-4 h-4 mr-1" />
              )}
              {isEditing ? "Save Changes" : "Add Server"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
