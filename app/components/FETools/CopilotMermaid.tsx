"use client"; // only necessary if you are using Next.js with the App Router.
import { useCopilotAction } from "@copilotkit/react-core";
import { useArtifacts } from "../Artifacts/ArtifactsContext";
import { ResourceStatus, useResource } from "../Artifacts/ResourceContext";
import { MermaidDisplayer } from "../Artifacts/Displayers/MermaidDisplayer";
import { useEffect, useRef } from "react";
import { useMount } from "ahooks";
export function CopilotMermaid(props: { enable?: boolean }) {
  const { registerDisplayComponent } = useArtifacts();
  const { addResource } = useResource();

  useEffect(() => {
    // Register the Mermaid display component
    registerDisplayComponent({
      id: "mermaid-displayer",
      name: "Mermaid Diagram",
      component: MermaidDisplayer,
      supportedTypes: ["mermaid"],
    });
  }, [registerDisplayComponent]);

  const resource = useResource();
  useCopilotAction({
    name: "绘制 Mermaid 图",
    description: "这个工具用于展示 Mermaid 图",
    parameters: [
      {
        name: "name",
        type: "string",
        description: "图表名称",
        required: true,
      },
      {
        name: "mermaid_code",
        type: "string",
        description: "用于展示的 mermaid 代码",
        required: true,
      },
    ],
    available: props.enable ? "enabled" : "disabled",
    render: ({ status, args }) => {
      const { mermaid_code, name } = args;
      // 使用 useRef 创建一个不变的 ID
      const idRef = useRef(`id-${Math.random().toString(36).substr(2, 9)}`);
      addResource({
        id: idRef.current,
        name: name!,
        path: `mermaid/${name}`,
        content: mermaid_code || "",
        type: "mermaid",
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
