"use client";

interface AddServerFormProps {
  isEditing: boolean;
  serverName: string;
  connectionType: "stdio" | "sse";
  command: string;
  args: string;
  url: string;
  onServerNameChange: (value: string) => void;
  onConnectionTypeChange: (type: "stdio" | "sse") => void;
  onCommandChange: (value: string) => void;
  onArgsChange: (value: string) => void;
  onUrlChange: (value: string) => void;
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
  onServerNameChange,
  onConnectionTypeChange,
  onCommandChange,
  onArgsChange,
  onUrlChange,
  onClose,
  onSubmit,
}: AddServerFormProps) {
  return (
    <div className="fixed inset-0 shadow-sm border flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isEditing
                    ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    : "M12 4v16m8-8H4"
                }
              />
            </svg>
            {isEditing ? "Edit Server" : "Add New Server"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
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
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onConnectionTypeChange("stdio")}
                className={`px-3 py-2 border rounded-md text-center flex items-center justify-center ${
                  connectionType === "stdio"
                    ? "bg-gray-200 border-gray-400 text-gray-800"
                    : "bg-white text-gray-700"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mr-1"
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mr-1"
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
                SSE
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
          ) : (
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
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 text-sm font-medium flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isEditing ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"}
                />
              </svg>
              {isEditing ? "Save Changes" : "Add Server"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
