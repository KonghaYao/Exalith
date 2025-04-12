"use client";

import { useState, useMemo } from "react";
import { CopyButton } from "../CopyButton";
import { StatusBadge } from "./StatusBadge";
import { useJSONFormatter } from "../../hooks/useJSONFormatter";
import { ChevronDown } from "lucide-react";

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
  const [displayMode, setDisplayMode] = useState<"json" | "text">("text");

  const derivedStatus = useMemo(() => {
    if (typeof result === 'string' && result.startsWith('Error')) {
      return 'error';
    }
    return status;
  }, [result, status]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const memoizedArgs = useJSONFormatter(args, "json");
  const memoizedResult = useJSONFormatter(result, displayMode);

  return (
    <div className="my-2 rounded-4xl border-gradient-cool overflow-hidden shadow-sm">
      {/* Header - always visible */}
      <div
        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={toggleExpand}
      >
        <div className="flex items-center space-x-2 flex-1">
          <div className="flex items-center space-x-2">
            <StatusBadge status={derivedStatus} />
          </div>
          <div className="font-medium text-gray-700 flex-1">{name}</div>
          {/* <Timer status={result} /> */}
        </div>
        <button
          className="text-gray-500 hover:text-gray-700 focus:outline-none transition-transform transform"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <ChevronDown
            className={`h-5 w-5 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Details - visible when expanded */}
      {isExpanded && (
        <div className="p-3 border-t border-gray-200">
          {/* Arguments Section */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <div className="text-sm font-medium text-gray-500">
                Arguments:
              </div>
              <CopyButton text={memoizedArgs} />
            </div>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all max-w-full max-h-40">
              {memoizedArgs}
            </pre>
          </div>

          {/* Result Section - shown only if there's a result */}
          {result && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium text-gray-500">Result:</div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDisplayMode("json");
                    }}
                    className={`px-2 py-1 text-xs rounded ${displayMode === "json" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDisplayMode("text");
                    }}
                    className={`px-2 py-1 text-xs rounded ${displayMode === "text" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}
                  >
                    Text
                  </button>
                  <CopyButton text={memoizedResult} />
                </div>
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
