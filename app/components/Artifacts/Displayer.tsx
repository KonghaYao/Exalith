import { useArtifacts } from "./ArtifactsContext";
import { useResource } from "./ResourceContext";
import { CodeDisplayer } from "./Displayers/CodeDisplayer";
import { Code2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArtifactDisplayProps {
  resourceName: string;
  fallback?: React.ReactNode;
}

export function ArtifactDisplay({
  resourceName,
  fallback,
}: ArtifactDisplayProps) {
  const { getResource, showSourceCode, setShowSourceCode } = useResource();
  const { getDisplayComponent } = useArtifacts();

  const resource = getResource(resourceName);
  if (!resource) {
    return fallback || <div>Resource not found: {resourceName}</div>;
  }

  const DisplayComponent = getDisplayComponent(resource.type);
  if (!DisplayComponent && !showSourceCode) {
    return (
      fallback || (
        <div>No display component found for type: {resource.type}</div>
      )
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setShowSourceCode(false)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              !showSourceCode
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-700 hover:text-gray-900"
            )}
          >
            <FileText className="h-4 w-4" />
            Original
          </button>
          <button
            onClick={() => setShowSourceCode(true)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              showSourceCode
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-700 hover:text-gray-900"
            )}
          >
            <Code2 className="h-4 w-4" />
            Code
          </button>
        </div>
      </div>
      {showSourceCode ? (
        <CodeDisplayer resource={resource} />
      ) : (
        DisplayComponent && <DisplayComponent.component resource={resource} />
      )}
    </div>
  );
}
