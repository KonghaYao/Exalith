"use client";

import { useState, useMemo, useCallback } from "react";

type ToolCallRendererProps = {
  name: string;
  args: any;
  status: string;
  result: any;
};

export const ToolCallRenderer: React.FC<ToolCallRendererProps> = ({
  name,
  args,
  status,
  result,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Format JSON objects for display
  const formatJSON = useCallback((obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }, []);

  const memoizedArgs = useMemo(() => formatJSON(args), [args, formatJSON]);
  const memoizedResult = useMemo(
    () => result && formatJSON(result),
    [result, formatJSON],
  );

  // Status color mapping
  const statusColors: Record<string, string> = {
    executing: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    complete: "bg-green-100 text-green-800 border border-green-300",
    error: "bg-red-100 text-red-800 border border-red-300",
    inProgress: "bg-blue-100 text-blue-800 border border-blue-300",
    unknown: "bg-gray-100 text-gray-800 border border-gray-300",
  };

  const statusColor = useMemo(
    () => statusColors[status.toLowerCase()] || statusColors.unknown,
    [status],
  );

  return (
    <div className="my-2 rounded-4xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header - always visible */}
      <div
        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={toggleExpand}
      >
        <div className="flex items-center space-x-2">
          <div
            className={`text-xs px-2 py-1 rounded-full ${statusColor} transition-colors duration-200 ease-in-out`}
          >
            {status}
          </div>
          <div className="font-medium text-gray-700">{name}</div>
        </div>
        <button
          className="text-gray-500 hover:text-gray-700 focus:outline-none transition-transform transform"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <svg
            className={`h-5 w-5 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Details - visible when expanded */}
      {isExpanded && (
        <div className="p-3 border-t border-gray-200">
          {/* Arguments Section */}
          <div className="mb-3">
            <div className="text-sm font-medium text-gray-500 mb-1">
              Arguments:
            </div>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all max-w-full max-h-40">
              {memoizedArgs}
            </pre>
          </div>

          {/* Result Section - shown only if there's a result */}
          {result && (
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">
                Result:
              </div>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all max-w-full max-h-40">
                {memoizedResult}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
