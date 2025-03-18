import { useState } from 'react';
import { useResource } from './ResourceContext';
import { ArtifactDisplay } from './Displayer';

export function ArtifactsWrapper() {
    const { resources, selectedResource, setSelectedResource } = useResource();

    return (
        <div className="flex h-full overflow-hidden">
            {/* Resource List Sidebar */}
            <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4">
                    资源列表
                </h2>
                <div className="space-y-2">
                    {resources.map((resource) => (
                        <button
                            key={resource.id}
                            onClick={() => setSelectedResource(resource.id)}
                            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${selectedResource === resource.id
                                ? 'bg-blue-100 text-blue-700'
                                : 'hover:bg-gray-100'
                                }`}
                        >
                            {resource.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Display Area */}
            <div className="flex-1 p-6 overflow-y-auto ">
                {selectedResource ? (
                    <ArtifactDisplay resourceName={selectedResource} />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        选择资源进行展示
                    </div>
                )}
            </div>
        </div>
    );
}
