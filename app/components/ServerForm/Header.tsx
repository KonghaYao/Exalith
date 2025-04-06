"use client";
import {
  PlusIcon,
  ServerIcon,
  Upload,
  Download,
  ExternalLink as ExternalLinkIcon,
} from "lucide-react";

interface HeaderProps {
  onImportConfig: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportConfig: () => void;
  onAddServer: () => void;
}

export function Header({
  onImportConfig,
  onExportConfig,
  onAddServer,
}: HeaderProps) {
  return (
    <div className="mb-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-1">
        <div className="flex items-center">
          <ServerIcon></ServerIcon>
          <h1 className="ml-4 text-3xl sm:text-5xl font-semibold">MCP 设置</h1>
        </div>
      </div>
      <div className="flex flex-col justify-between items-start sm:items-center mt-4 gap-4">
        <div className="flex flex-row sm:items-center gap-3">
          <p className="text-sm text-gray-600">
            Manage and configure your MCP servers
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/CopilotKit/mcp-client-langgraph"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <span className="mr-1">GitHub</span>
              <ExternalLinkIcon className="w-3 h-3 ml-1" />
            </a>
            <a
              href="https://docs.copilotkit.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <span className="mr-1">CopilotKit</span>
              <ExternalLinkIcon className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            onChange={onImportConfig}
            className="hidden"
            id="import-config"
          />
          <button
            onClick={() => document.getElementById("import-config")?.click()}
            className="w-full sm:w-auto px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-1 justify-center"
          >
            <Upload className="h-4 w-4" />
            导入配置
          </button>
          <button
            onClick={onExportConfig}
            className="w-full sm:w-auto px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-1 justify-center"
          >
            <Download className="h-4 w-4" />
            导出配置
          </button>
          <button
            onClick={onAddServer}
            className="w-full sm:w-auto px-3 py-1.5 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-700 flex items-center gap-1 justify-center"
          >
            <PlusIcon />
            Add Server
          </button>
        </div>
      </div>
    </div>
  );
}
