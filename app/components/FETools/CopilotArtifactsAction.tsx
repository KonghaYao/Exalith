"use client";
import { useCopilotAction } from "@copilotkit/react-core";
import { useArtifacts } from "../Artifacts/ArtifactsContext";
import { ResourceStatus, useResource } from "../Artifacts/ResourceContext";
import { useEffect, useId, useRef } from "react";
import { useMount } from "ahooks";
import { useTab } from "../TabContext";
import { MarkdownDisplayer } from "../Artifacts/Displayers/MarkdownDisplayer";

export function CopilotArtifactsAction(props: { enable?: boolean }) {
  const { registerDisplayComponent } = useArtifacts();
  const { addResource } = useResource();
  const { setTab } = useTab()
  useEffect(() => {
    // Register the Mermaid display component
    registerDisplayComponent({
      id: "markdown-displayer",
      name: "Markdown展示",
      component: MarkdownDisplayer,
      supportedTypes: ["markdown"],
    });
  }, [registerDisplayComponent]);

  const resource = useResource();
  useCopilotAction({
    name: "write_temp_artifacts",
    description: "临时写入 Markdown 请使用这个工具",
    parameters: [
      {
        name: "name",
        type: "string",
        description: "文件名称",
        required: true,
      },
      {
        name: "type",
        type: "string",
        description: "资源类型, 允许 markdown",
        required: true,
      },
      {
        name: "content",
        type: "string",
        description: "资源内容",
        required: true,
      },
    ],
    available: props.enable ? "enabled" : "disabled",
    render: ({ status, args }) => {
      const { content, name } = args;
      // 使用 useRef 创建一个不变的 ID
      const idRef = useId();
      //   每次都进行更新
      addResource({
        id: idRef,
        name: name!,
        path: `artifacts/${name}`,
        content: content || "",
        type: args.type || "markdown",
        status:
          status === "complete" ? ResourceStatus.READY : ResourceStatus.LOADING,
      });
      const previewType = ['markdown']
      const handleResourcePreview = () => {
        resource.setSelectedResource(idRef);
        if (previewType.includes(args.type || "markdown")) {
          resource.setShowSourceCode(false)
        } else {
          resource.setShowSourceCode(true)
        }
        setTab("artifacts")
      };

      useMount(handleResourcePreview);
      useEffect(() => {
        if (status === "executing") {
          resource.previewResource(idRef);
        } else if (status === "complete") {
          handleResourcePreview()
        }
      }, [status]);
      return (
        <div
          className="border rounded-lg shadow-sm p-4 bg-white"
          onClick={() => {
            resource.setSelectedResource(idRef);
            setTab("artifacts")
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
