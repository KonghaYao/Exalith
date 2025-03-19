import { useState } from "react";
import { useResource } from "./ResourceContext";
import { ArtifactDisplay } from "./Displayer";
import { ListIcon, ShieldCloseIcon } from "lucide-react";

export function ArtifactsWrapper() {
  const { resources, selectedResource, setSelectedResource } = useResource();
  const [showResourceList, setShowResourceList] = useState(false);
  return (
    <div className="flex h-full  border relative overflow-auto">
      {/* Display Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-neutral-100">
        {selectedResource ? (
          <ArtifactDisplay resourceName={selectedResource} key={selectedResource} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 ">
            选择资源进行展示
          </div>
        )}
      </div>
      {/* Resource List Sidebar */}
      {showResourceList && (
        <div className="w-64 border-r p-4 overflow-y-auto absolute right-0 top-0 bg-gray-50 h-full">
          <h2 className="text-lg font-semibold mb-4">资源列表</h2>
          <div className="space-y-2">
            {resources.map((resource) => (
              <button
                key={resource.id}
                onClick={() => setSelectedResource(resource.id)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedResource === resource.id
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-100"
                }`}
              >
                {resource.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div
        className="absolute z-10 top-5 right-5 "
        onClick={() => setShowResourceList(!showResourceList)}
      >
        {showResourceList ? (
          <ShieldCloseIcon></ShieldCloseIcon>
        ) : (
          <ListIcon></ListIcon>
        )}
      </div>
    </div>
  );
}
