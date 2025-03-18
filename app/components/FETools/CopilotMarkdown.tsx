"use client";
import { useCopilotAction } from "@copilotkit/react-core";
import { useArtifacts } from "../Artifacts/ArtifactsContext";
import { ResourceStatus, useResource } from "../Artifacts/ResourceContext";
import { useEffect, useRef } from "react";
import { useMount } from "ahooks";
import { CodeDisplayer } from "../Artifacts/Displayers/CodeDisplayer";
export function CopilotMarkdown(props: { enable?: boolean }) {
  const { registerDisplayComponent } = useArtifacts();
  const { addResource } = useResource();

  useEffect(() => {
    // Register the Mermaid display component
    registerDisplayComponent({
      id: "markdown-displayer",
      name: "Markdown展示",
      component: CodeDisplayer,
      supportedTypes: ["markdown"],
    });
  }, [registerDisplayComponent]);

  const resource = useResource();
  useCopilotAction({
    name: "保存并展示 Markdown",
    description: "这个工具用于展示 Markdown ",
    parameters: [
      {
        name: "name",
        type: "string",
        description: "文件名称",
        required: true,
      },
      {
        name: "markdown",
        type: "string",
        description: "用于展示的 Markdown 代码",
        required: true,
      },
    ],
    available: props.enable ? "enabled" : "disabled",
    render: ({ status, args }) => {
      const { markdown, name } = args;
      // 使用 useRef 创建一个不变的 ID
      const idRef = useRef(`id-${Math.random().toString(36).substr(2, 9)}`);
      addResource({
        id: idRef.current,
        name: name!,
        path: `markdown/${name}`,
        content: markdown || "",
        type: "markdown",
        status:
          status === "complete" ? ResourceStatus.READY : ResourceStatus.LOADING,
      });
      useMount(() => {
        resource.setSelectedResource(idRef.current!);
      });
      useEffect(() => {
        if (status === "executing") {
          resource.previewResource(idRef.current!);
        }
      }, [status]);
      return (
        <div
          className="border rounded-lg shadow-sm p-4 bg-white"
          onClick={() => {
            resource.setSelectedResource(idRef.current!);
          }}
        >
          <div className="text-sm text-gray-500 mb-2">
            <span>已添加到资源列表</span>
            <span>
              {status === "complete"
                ? "已写入" + name!
                : status === "executing"
                ? "预览中..."
                : status === "inProgress"
                ? "加载中"
                : "准备中"}
            </span>
          </div>
        </div>
      );
    },
  });
}
