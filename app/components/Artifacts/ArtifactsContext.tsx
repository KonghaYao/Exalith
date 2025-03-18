import React, { createContext, useContext, useState, ReactNode } from "react";
import { Resource, useResource } from "./ResourceContext";

export interface DisplayComponent {
  id: string;
  name: string;
  component: React.ComponentType<{ resource: Resource }>;
  supportedTypes: string[];
}

interface ArtifactsContextType {
  displayComponents: DisplayComponent[];
  registerDisplayComponent: (component: DisplayComponent) => void;
  unregisterDisplayComponent: (id: string) => void;
  getDisplayComponent: (resourceType: string) => DisplayComponent | undefined;
}

const ArtifactsContext = createContext<ArtifactsContextType | undefined>(
  undefined
);

export function ArtifactsProvider({ children }: { children: ReactNode }) {
  const [displayComponents, setDisplayComponents] = useState<
    DisplayComponent[]
  >([]);

  const registerDisplayComponent = (component: DisplayComponent) => {
    setDisplayComponents((prev) => {
      // Check if component with same id already exists
      if (prev.some((c) => c.id === component.id)) {
        console.warn(
          `Display component with id ${component.id} already exists`
        );
        return prev;
      }
      return [...prev, component];
    });
  };

  const unregisterDisplayComponent = (id: string) => {
    setDisplayComponents((prev) =>
      prev.filter((component) => component.id !== id)
    );
  };

  const getDisplayComponent = (resourceType: string) => {
    return displayComponents.find((component) =>
      component.supportedTypes.includes(resourceType)
    );
  };

  return (
    <ArtifactsContext.Provider
      value={{
        displayComponents,
        registerDisplayComponent,
        unregisterDisplayComponent,
        getDisplayComponent,
      }}
    >
      {children}
    </ArtifactsContext.Provider>
  );
}

export function useArtifacts() {
  const context = useContext(ArtifactsContext);
  if (context === undefined) {
    throw new Error("useArtifacts must be used within an ArtifactsProvider");
  }
  return context;
}

interface ArtifactDisplayProps {
  resourceName: string;
  fallback?: React.ReactNode;
}

export function ArtifactDisplay({
  resourceName,
  fallback,
}: ArtifactDisplayProps) {
  const { getResource } = useResource();
  const { getDisplayComponent } = useArtifacts();

  const resource = getResource(resourceName);
  if (!resource) {
    return fallback || <div>Resource not found: {resourceName}</div>;
  }

  const DisplayComponent = getDisplayComponent(resource.type);
  if (!DisplayComponent) {
    return (
      fallback || (
        <div>No display component found for type: {resource.type}</div>
      )
    );
  }

  return <DisplayComponent.component resource={resource} />;
}
