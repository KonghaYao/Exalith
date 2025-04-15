"use client";
import { Resource } from "../ResourceContext";
import { Markdown } from '@copilotkit/react-ui';
interface MarkdownDisplayerProps {
  resource: Resource;
}

export function MarkdownDisplayer({ resource }: MarkdownDisplayerProps) {
  return (
    <div className="p-4">
      <Markdown content={resource.content} />
    </div>
  );
}
