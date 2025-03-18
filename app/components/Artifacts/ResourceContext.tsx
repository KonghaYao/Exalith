import React, { createContext, useContext, useState, ReactNode } from 'react';

export enum ResourceStatus {
  PENDING = "pending",
  READY = "ready",
  ERROR = "error",
  LOADING = "loading",
  DELETED = "deleted"
}


export interface Resource {
  name: string;
  path: string;
  content: string;
  type: string;
  status: ResourceStatus;
}

interface ResourceContextType {
  resources: Resource[];
  showSourceCode: boolean;
  setShowSourceCode: (show: boolean) => void;
  selectedResource: string | null;
  previewResource: (name: string) => void
  setSelectedResource: (name: string | null) => void;
  addResource: (resource: Resource) => void;
  getResource: (name: string) => Resource | undefined;
  removeResource: (name: string) => void;
  updateResource: (name: string, resource: Partial<Resource>) => void;
}

const ResourceContext = createContext<ResourceContextType | undefined>(undefined);

export function ResourceProvider({ children }: { children: ReactNode }) {
  const [resources, setResources] = useState<Resource[]>([]);

  const addResource = (resource: Resource) => {
    setResources((prev) => {
      const existingIndex = prev.findIndex((r) => r.name === resource.name);
      if (existingIndex >= 0) {
        // Update existing resource
        const newResources = [...prev];
        newResources[existingIndex] = resource;
        return newResources;
      }
      // Add new resource
      return [...prev, resource];
    });
  };

  const getResource = (name: string) => {
    return resources.find((resource) => resource.name === name);
  };

  const removeResource = (name: string) => {
    setResources((prev) => prev.filter((resource) => resource.name !== name));
  };

  const updateResource = (name: string, updatedResource: Partial<Resource>) => {
    setResources((prev) =>
      prev.map((resource) =>
        resource.name === name ? { ...resource, ...updatedResource } : resource
      )
    );
  };
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

  const [showSourceCode, setShowSourceCode] = useState(true);
  const previewResource = (name: string) => {
    setSelectedResource(name)
    setShowSourceCode(true)
  }
  return (
    <ResourceContext.Provider
      value={{
        resources,
        selectedResource,
        setSelectedResource,
        previewResource,
        addResource,
        showSourceCode, setShowSourceCode,
        getResource,
        removeResource,
        updateResource,
      }}
    >
      {children}
    </ResourceContext.Provider>
  );
}

export function useResource() {
  const context = useContext(ResourceContext);
  if (context === undefined) {
    throw new Error('useResource must be used within a ResourceProvider');
  }
  return context;
} 