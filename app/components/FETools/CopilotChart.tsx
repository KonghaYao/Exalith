"use client"; // only necessary if you are using Next.js with the App Router.
import { useCopilotAction } from "@copilotkit/react-core";
import { useArtifacts } from "../Artifacts/ArtifactsContext";
import { ResourceStatus, useResource } from "../Artifacts/ResourceContext";
import { useEffect, useRef } from "react";
import { useMount } from "ahooks";
import { EchartsDisplayer } from "../Artifacts/Displayers/EchartsDisplayer";
export function CopilotChart(props: { enable?: boolean }) {
  const { registerDisplayComponent } = useArtifacts();
  const { addResource } = useResource();

  useEffect(() => {
    // Register the Mermaid display component
    registerDisplayComponent({
      id: "echarts-displayer",
      name: "echarts Diagram",
      component: EchartsDisplayer,
      supportedTypes: ["echarts"],
    });
  }, [registerDisplayComponent]);

  const resource = useResource();
  useCopilotAction({
    name: "绘制 ECharts 图",
    description: "这个工具用于展示 Echarts 图",
    parameters: [
      {
        name: "name",
        type: "string",
        description: "图表名称",
        required: true,
      },
      {
        name: "options",
        type: "string",
        description: "用于展示的 ECharts Options，格式为JSON 字符串",
        required: true,
      },
    ],
    available: props.enable ? "enabled" : "disabled",
    render: ({ status, args }) => {
      const { options, name } = args;
      const idRef = useRef(`id-${Math.random().toString(36).substr(2, 9)}`);
      addResource({
        id: idRef.current,
        name: name!,
        path: `echarts/${name}`,
        content: options || "",
        type: "echarts",
        status:
          status === "complete" ? ResourceStatus.READY : ResourceStatus.LOADING,
      });
      useMount(() => {
        resource.setSelectedResource(idRef.current!);
        resource.setShowSourceCode(true)
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
