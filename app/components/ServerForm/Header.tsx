"use client";

interface HeaderProps {
  onImportConfig: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportConfig: () => void;
  onAddServer: () => void;
}

const ExternalLink = () => (
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
);

export function Header({
  onImportConfig,
  onExportConfig,
  onAddServer,
}: HeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-1">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
            />
          </svg>
          <h1 className="text-3xl sm:text-5xl font-semibold">
            Open MCP Client
          </h1>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
              <span className="mr-1">GitHub Repo</span>
              <ExternalLink />
            </a>
            <a
              href="https://docs.copilotkit.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <span className="mr-1">Documentation</span>
              <ExternalLink />
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            导入配置
          </button>
          <button
            onClick={onExportConfig}
            className="w-full sm:w-auto px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-1 justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            导出配置
          </button>
          <button
            onClick={onAddServer}
            className="w-full sm:w-auto px-3 py-1.5 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-700 flex items-center gap-1 justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Server
          </button>
        </div>
      </div>
    </div>
  );
}
